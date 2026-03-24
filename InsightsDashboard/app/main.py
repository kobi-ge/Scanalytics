from fastapi import FastAPI
from app.api.endpoints import router
import uvicorn

app = FastAPI(
    title="Insights API",
    description="Microservice that queries an Elasticsearch index for financial statistics and search."
)

app.include_router(router)

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8091, reload=True)
