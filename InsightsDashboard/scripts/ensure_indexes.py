"""CLI: python -m scripts.ensure_indexes (run from InsightsDashboard/)"""
import asyncio

from app.core.indexes import ensure_all_indexes


async def main() -> None:
    await ensure_all_indexes()
    print("Indexes ensured.")


if __name__ == "__main__":
    asyncio.run(main())
