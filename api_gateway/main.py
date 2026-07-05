import os
from typing import Any

import httpx
from dotenv import find_dotenv, load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

load_dotenv(find_dotenv())

from api.routers import router
from logging_system.logger import log_to_elastic

app = FastAPI(title="API Gateway for Receipt Processing")


def get_allowed_origins() -> list[str]:
    raw_origins = os.getenv(
        "FRONTEND_ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://frontend:5173",
    )
    return [origin.strip() for origin in raw_origins.split(",") if origin.strip()]


app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


@app.on_event("startup")
async def startup_event() -> None:
    log_to_elastic("INFO", "API Gateway service started")


async def proxy_request(
    request: Request,
    target_base_url: str,
    target_path: str,
) -> Response:
    forwarded_headers = {
        key: value
        for key, value in request.headers.items()
        if key.lower()
        not in {
            "host",
            "content-length",
            "connection",
            "keep-alive",
            "proxy-authenticate",
            "proxy-authorization",
            "te",
            "trailers",
            "transfer-encoding",
            "upgrade",
        }
    }

    forwarded_headers["x-forwarded-for"] = request.client.host if request.client else "unknown"
    forwarded_headers["x-forwarded-proto"] = request.url.scheme
    forwarded_headers["x-forwarded-host"] = request.headers.get("host", request.base_url.host)

    async with httpx.AsyncClient(timeout=httpx.Timeout(30.0, connect=30.0)) as client:
        response = await client.request(
            method=request.method,
            url=f"{target_base_url.rstrip('/')}{target_path}",
            headers=forwarded_headers,
            content=await request.body(),
            params=request.query_params,
            follow_redirects=False,
        )

    response_headers = {
        key: value
        for key, value in response.headers.items()
        if key.lower()
        not in {
            "content-length",
            "transfer-encoding",
            "connection",
            "keep-alive",
            "proxy-authenticate",
            "proxy-authorization",
            "te",
            "trailers",
            "upgrade",
        }
    }

    return Response(
        content=response.content,
        status_code=response.status_code,
        headers=response_headers,
        media_type=response.headers.get("content-type"),
    )


@app.api_route("/api/backend/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
async def proxy_backend(request: Request, path: str) -> Response:
    target_base_url = os.getenv("BACKEND_SERVICE_URL", "http://backend:3000")
    return await proxy_request(request, target_base_url, f"/api/{path}" if path else "/api")


@app.api_route("/api/insights/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
async def proxy_insights(request: Request, path: str) -> Response:
    target_base_url = os.getenv("INSIGHTS_SERVICE_URL", "http://insights_dashboard:8001")
    return await proxy_request(request, target_base_url, f"/{path}" if path else "/")


app.include_router(router, prefix="/api/ingestion")

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000)
