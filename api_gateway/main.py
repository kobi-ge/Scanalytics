from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv())

from fastapi import FastAPI
from api.routers import router
from logging_system.logger import log_to_elastic

app = FastAPI(title="API Gateway for Receipt Processing")

@app.on_event("startup")
async def startup_event():
    log_to_elastic("INFO", "API Gateway service started")

app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000)
