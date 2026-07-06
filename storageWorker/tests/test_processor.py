import asyncio
import sys
import types
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

elasticsearch_stub = types.ModuleType("elasticsearch")


class DummyElasticsearch:
    def __init__(self, *args, **kwargs):
        pass


class DummyAsyncElasticsearch:
    def __init__(self, *args, **kwargs):
        pass


elasticsearch_stub.Elasticsearch = DummyElasticsearch
elasticsearch_stub.AsyncElasticsearch = DummyAsyncElasticsearch
helpers_module = types.ModuleType("elasticsearch.helpers")
helpers_module.async_bulk = None
elasticsearch_stub.helpers = helpers_module
sys.modules.setdefault("elasticsearch", elasticsearch_stub)
sys.modules.setdefault("elasticsearch.helpers", helpers_module)

motor_module = types.ModuleType("motor")
motor_asyncio_module = types.ModuleType("motor.motor_asyncio")


class DummyAsyncIOMotorDatabase:
    pass


motor_asyncio_module.AsyncIOMotorDatabase = DummyAsyncIOMotorDatabase
sys.modules.setdefault("motor", motor_module)
sys.modules.setdefault("motor.motor_asyncio", motor_asyncio_module)

from app.services.es_service import ElasticsearchService
from app.services.processor import StorageProcessor


class DummyMongoService:
    def __init__(self):
        self.calls = []

    async def save_receipt(self, doc_id, data):
        self.calls.append((doc_id, data))


class DummyESService:
    def __init__(self):
        self.calls = []

    async def save_receipt_items(self, user_id, receipt_id, data, file_id=None):
        self.calls.append((user_id, receipt_id, data, file_id))


def test_save_receipt_items_builds_es_actions_from_receipt_payload():
    captured = {}

    async def fake_bulk(client, actions):
        captured["actions"] = actions

    with patch("app.services.es_service.helpers.async_bulk", new=AsyncMock(side_effect=fake_bulk)) as bulk_mock, patch(
        "app.services.es_service.log_to_elastic"
    ) as log_mock:
        service = ElasticsearchService(es_client=object())
        data = {
            "receipt_id": "receipt-1",
            "user_id": "user-1",
            "file_id": "file-1",
            "store": "Corner Store",
            "purchase_date": "2026-07-06",
            "total_price": 12.5,
            "items": [{"name": "Milk", "quantity": 2, "price": 3.5, "category": "Food & Groceries"}],
        }

        asyncio.run(service.save_receipt_items("user-1", "receipt-1", data, "file-1"))

    assert len(captured["actions"]) == 1
    action = captured["actions"][0]
    assert action["_id"] == "user-1_file-1_receipt-1_0"
    assert action["_source"]["store"] == "Corner Store"
    assert action["_source"]["name"] == "Milk"
    assert action["_source"]["receipt_id"] == "receipt-1"
    assert "items" not in action["_source"]
    bulk_mock.assert_awaited_once()
    assert log_mock.called


def test_save_receipt_items_returns_early_for_empty_items():
    with patch("app.services.es_service.helpers.async_bulk", new=AsyncMock()) as bulk_mock:
        service = ElasticsearchService(es_client=object())
        data = {"receipt_id": "receipt-1", "user_id": "user-1", "items": []}

        asyncio.run(service.save_receipt_items("user-1", "receipt-1", data, "file-1"))

    bulk_mock.assert_not_awaited()


def test_save_receipt_items_raises_type_error_for_malformed_items_payload():
    service = ElasticsearchService(es_client=object())

    with pytest.raises(TypeError):
        asyncio.run(service.save_receipt_items("user-1", "receipt-1", {"items": "bad"}, "file-1"))


def test_process_message_saves_receipt_and_items_for_valid_payload():
    mongo_service = DummyMongoService()
    es_service = DummyESService()
    processor = StorageProcessor(mongo_service, es_service)
    data = {
        "receipt_id": "receipt-1",
        "user_id": "user-1",
        "file_id": "file-1",
        "store": "Corner Store",
        "items": [{"name": "Milk", "quantity": 1, "price": 3.5, "category": "Food & Groceries"}],
    }

    asyncio.run(processor.process_message(data))

    assert mongo_service.calls[0][0] == "user-1_receipt-1"
    assert mongo_service.calls[0][1] == data
    assert es_service.calls == [("user-1", "receipt-1", data, "file-1")]


def test_process_message_skips_payload_without_user_id():
    mongo_service = DummyMongoService()
    es_service = DummyESService()
    processor = StorageProcessor(mongo_service, es_service)

    with patch("app.services.processor.log_to_elastic") as log_mock:
        asyncio.run(processor.process_message({"receipt_id": "receipt-1", "file_id": "file-1"}))

    assert mongo_service.calls == []
    assert es_service.calls == []
    assert log_mock.called


def test_process_message_raises_attribute_error_for_non_mapping_payload():
    mongo_service = DummyMongoService()
    es_service = DummyESService()
    processor = StorageProcessor(mongo_service, es_service)

    with pytest.raises(AttributeError):
        asyncio.run(processor.process_message("not-a-dict"))
