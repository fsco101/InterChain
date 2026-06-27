from __future__ import annotations

import json
import re
from collections.abc import AsyncIterator
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

from bson import ObjectId


def _match_value(doc_value, condition) -> bool:
    if isinstance(condition, dict):
        for op, operand in condition.items():
            if op == '$regex':
                flags = 0
                options = condition.get('$options', '')
                if 'i' in options:
                    flags |= re.IGNORECASE
                if doc_value is None:
                    return False
                if not re.search(operand, str(doc_value), flags):
                    return False
            elif op == '$options':
                continue
            elif op == '$ne':
                if doc_value == operand:
                    return False
        return True
    return doc_value == condition


def _matches(document: dict, query: dict | None) -> bool:
    if not query:
        return True

    for key, condition in query.items():
        if key == '$or':
            if not any(_matches(document, branch) for branch in condition):
                return False
        elif key == '$and':
            if not all(_matches(document, branch) for branch in condition):
                return False
        else:
            if not _match_value(document.get(key), condition):
                return False
    return True


def _serialize_value(value):
    if isinstance(value, ObjectId):
        return {"$oid": str(value)}
    if isinstance(value, datetime):
        return {"$datetime": value.isoformat()}
    if isinstance(value, dict):
        return {key: _serialize_value(inner_value) for key, inner_value in value.items()}
    if isinstance(value, list):
        return [_serialize_value(item) for item in value]
    return value


def _deserialize_value(value):
    if isinstance(value, dict):
        if "$oid" in value:
            return ObjectId(value["$oid"])
        if "$datetime" in value:
            return datetime.fromisoformat(value["$datetime"])
        return {key: _deserialize_value(inner_value) for key, inner_value in value.items()}
    if isinstance(value, list):
        return [_deserialize_value(item) for item in value]
    return value


class _FallbackStorage:
    def __init__(self):
        self.file_path = Path(__file__).resolve().parents[2] / "data" / "fallback_db.json"
        self.file_path.parent.mkdir(parents=True, exist_ok=True)
        self.collections: dict[str, list[dict]] = self._load()

    def _load(self) -> dict[str, list[dict]]:
        if not self.file_path.exists():
            return {}

        try:
            raw_data = json.loads(self.file_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return {}

        collections: dict[str, list[dict]] = {}
        for collection_name, documents in raw_data.items():
            collections[collection_name] = [_deserialize_value(document) for document in documents]
        return collections

    def persist(self) -> None:
        payload = {
            collection_name: [_serialize_value(document) for document in documents]
            for collection_name, documents in self.collections.items()
        }
        self.file_path.write_text(json.dumps(payload, indent=2, default=str), encoding="utf-8")


@dataclass
class _InsertResult:
    inserted_id: ObjectId


@dataclass
class _UpdateResult:
    matched_count: int
    modified_count: int


@dataclass
class _DeleteResult:
    deleted_count: int


class _FallbackCursor:
    def __init__(self, documents: list[dict]):
        self._documents = documents
        self._index = 0

    def sort(self, key: str, direction: int):
        reverse = direction < 0
        self._documents.sort(
            key=lambda document: document.get(key) or datetime.min.replace(tzinfo=PHT),
            reverse=reverse,
        )
        return self

    def limit(self, count: int):
        self._documents = self._documents[:count]
        return self

    def __aiter__(self) -> AsyncIterator[dict]:
        self._index = 0
        return self

    async def __anext__(self) -> dict:
        if self._index >= len(self._documents):
            raise StopAsyncIteration
        document = self._documents[self._index]
        self._index += 1
        return document


class _FallbackCollection:
    def __init__(self, storage: _FallbackStorage, collection_name: str):
        self.storage = storage
        self.collection_name = collection_name
        self.documents = self.storage.collections.setdefault(collection_name, [])

    async def create_index(self, *args, **kwargs):
        return None

    async def insert_one(self, document: dict) -> _InsertResult:
        stored_document = document.copy()
        stored_document.setdefault("_id", ObjectId())
        self.documents.append(stored_document)
        self.storage.persist()
        return _InsertResult(inserted_id=stored_document["_id"])

    async def update_one(self, query: dict, update: dict, upsert: bool = False) -> _UpdateResult:
        for document in self.documents:
            if _matches(document, query):
                if '$set' in update:
                    document.update(update['$set'])
                if '$push' in update:
                    for field, value in update['$push'].items():
                        document.setdefault(field, []).append(value)
                if '$pull' in update:
                    for field, condition in update['$pull'].items():
                        document[field] = [
                            item for item in document.get(field, [])
                            if not _matches(item, condition)
                        ]
                self.storage.persist()
                return _UpdateResult(matched_count=1, modified_count=1)
        if upsert:
            new_doc = {}
            # extract equality fields from query as initial values
            for key, val in query.items():
                if not key.startswith('$') and not isinstance(val, dict):
                    new_doc[key] = val
            new_doc['_id'] = ObjectId()
            if '$set' in update:
                new_doc.update(update['$set'])
            if '$push' in update:
                for field, value in update['$push'].items():
                    new_doc.setdefault(field, []).append(value)
            self.documents.append(new_doc)
            self.storage.persist()
            return _UpdateResult(matched_count=0, modified_count=1)
        return _UpdateResult(matched_count=0, modified_count=0)

    async def delete_one(self, query: dict) -> _DeleteResult:
        for index, document in enumerate(self.documents):
            if _matches(document, query):
                del self.documents[index]
                self.storage.persist()
                return _DeleteResult(deleted_count=1)
        return _DeleteResult(deleted_count=0)

    async def find_one(self, query: dict | None = None) -> dict | None:
        for document in self.documents:
            if _matches(document, query):
                return document.copy()
        return None

    async def count_documents(self, query: dict | None = None) -> int:
        return sum(1 for document in self.documents if _matches(document, query))

    def find(self, query: dict | None = None) -> _FallbackCursor:
        matched_documents = [document.copy() for document in self.documents if _matches(document, query)]
        return _FallbackCursor(matched_documents)


class FallbackDatabase:
    def __init__(self):
        self._storage = _FallbackStorage()
        self._collections: dict[str, _FallbackCollection] = {}

    def __getattr__(self, collection_name: str) -> _FallbackCollection:
        return self.__getitem__(collection_name)

    def __getitem__(self, collection_name: str) -> _FallbackCollection:
        if collection_name not in self._collections:
            self._collections[collection_name] = _FallbackCollection(self._storage, collection_name)
        return self._collections[collection_name]
