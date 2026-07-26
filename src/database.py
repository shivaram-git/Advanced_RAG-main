import os
from pymongo import MongoClient
from typing import List, Dict, Optional
from datetime import datetime
import uuid
import threading

# Configuration
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
DB_NAME = os.getenv("MONGO_DB_NAME", "rag_chat")
COLLECTION_NAME = "conversations"

# Globals for DB availability and in-memory fallback
client: Optional[MongoClient] = None
db = None
conversations_collection = None
DB_AVAILABLE = False
_in_memory_lock = threading.Lock()
_in_memory_store: Dict[str, Dict] = {}

def init_db():
    """Attempt to initialize MongoDB; on failure fall back to an in-memory store.

    This allows the app to start even when Atlas/network/TLS is unavailable.
    """
    global client, db, conversations_collection, DB_AVAILABLE

    try:
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=10000)
        db = client[DB_NAME]
        conversations_collection = db[COLLECTION_NAME]
        # Try a lightweight operation to confirm connectivity
        conversations_collection.create_index("created_at")
        conversations_collection.create_index("updated_at")
        conversations_collection.create_index("runs.timestamp")
        DB_AVAILABLE = True
        print(f"[DB] MongoDB initialized — database: {DB_NAME}, collection: {COLLECTION_NAME}")
    except Exception as e:
        # If any error occurs (network/SSL/auth), print a warning and use in-memory store
        client = None
        db = None
        conversations_collection = None
        DB_AVAILABLE = False
        print(f"[WARN] MongoDB initialization failed — running with in-memory fallback: {e}")


class ConversationModel:
    @staticmethod
    def create(title: str) -> str:
        """Create a new conversation with an empty runs array"""
        conv_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        doc = {
            "_id": conv_id,
            "title": title,
            "created_at": now,
            "updated_at": now,
            "is_archived": False,
            "runs": []
        }

        if DB_AVAILABLE and conversations_collection is not None:
            conversations_collection.insert_one(doc)
        else:
            with _in_memory_lock:
                _in_memory_store[conv_id] = doc

        return conv_id

    @staticmethod
    def get_all(include_archived: bool = False) -> List[Dict]:
        """Get all conversations (without runs for list view)"""
        query = {} if include_archived else {"is_archived": False}
        projection = {
            "title": 1,
            "created_at": 1,
            "updated_at": 1,
            "is_archived": 1,
            # Include just a preview of the first run to show last conversation text
            "last_query": {"$arrayElemAt": ["$runs.query", -1]},
            "run_count": {"$size": {"$ifNull": ["$runs", []]}}
        }
        results = []
        if DB_AVAILABLE and conversations_collection is not None:
            try:
                cursor = conversations_collection.find(query, projection).sort("updated_at", -1)
                for doc in cursor:
                    results.append({
                        "id": doc["_id"],
                        "title": doc.get("title", ""),
                        "created_at": doc.get("created_at", ""),
                        "updated_at": doc.get("updated_at", ""),
                        "is_archived": doc.get("is_archived", False),
                        "messages": []
                    })
            except Exception as e:
                print(f"[WARN] MongoDB query failed in get_all: {e}. Falling back to in-memory store.")
                with _in_memory_lock:
                    for doc in sorted(_in_memory_store.values(), key=lambda d: d.get("updated_at", ""), reverse=True):
                        if not include_archived and doc.get("is_archived", False):
                            continue
                        results.append({
                            "id": doc["_id"],
                            "title": doc.get("title", ""),
                            "created_at": doc.get("created_at", ""),
                            "updated_at": doc.get("updated_at", ""),
                            "is_archived": doc.get("is_archived", False),
                            "messages": []
                        })
        else:
            with _in_memory_lock:
                for doc in sorted(_in_memory_store.values(), key=lambda d: d.get("updated_at", ""), reverse=True):
                    if not include_archived and doc.get("is_archived", False):
                        continue
                    results.append({
                        "id": doc["_id"],
                        "title": doc.get("title", ""),
                        "created_at": doc.get("created_at", ""),
                        "updated_at": doc.get("updated_at", ""),
                        "is_archived": doc.get("is_archived", False),
                        "messages": []
                    })

        return results

    @staticmethod
    def get(conversation_id: str) -> Optional[Dict]:
        """Get a specific conversation by ID including all runs"""
        if DB_AVAILABLE and conversations_collection is not None:
            doc = conversations_collection.find_one({"_id": conversation_id})
            if not doc:
                return None
            return {
                "id": doc["_id"],
                "title": doc.get("title", ""),
                "created_at": doc.get("created_at", ""),
                "updated_at": doc.get("updated_at", ""),
                "is_archived": doc.get("is_archived", False),
                "runs": doc.get("runs", [])
            }
        else:
            with _in_memory_lock:
                doc = _in_memory_store.get(conversation_id)
                if not doc:
                    return None
                return {
                    "id": doc["_id"],
                    "title": doc.get("title", ""),
                    "created_at": doc.get("created_at", ""),
                    "updated_at": doc.get("updated_at", ""),
                    "is_archived": doc.get("is_archived", False),
                    "runs": doc.get("runs", [])
                }

    @staticmethod
    def update(conversation_id: str, title: Optional[str] = None, is_archived: Optional[bool] = None):
        """Update a conversation's title or archive status"""
        updates = {"updated_at": datetime.now().isoformat()}
        if title is not None:
            updates["title"] = title
        if is_archived is not None:
            updates["is_archived"] = is_archived
        if DB_AVAILABLE and conversations_collection is not None:
            conversations_collection.update_one(
                {"_id": conversation_id},
                {"$set": updates}
            )
        else:
            with _in_memory_lock:
                doc = _in_memory_store.get(conversation_id)
                if not doc:
                    return
                doc.update(updates)

    @staticmethod
    def delete(conversation_id: str):
        """Delete a conversation document entirely"""
        if DB_AVAILABLE and conversations_collection is not None:
            conversations_collection.delete_one({"_id": conversation_id})
        else:
            with _in_memory_lock:
                if conversation_id in _in_memory_store:
                    del _in_memory_store[conversation_id]

    @staticmethod
    def search(query: str) -> List[Dict]:
        """Search conversations by title"""
        results = []
        if DB_AVAILABLE and conversations_collection is not None:
            cursor = conversations_collection.find(
                {"is_archived": False, "title": {"$regex": query, "$options": "i"}}
            ).sort("updated_at", -1)
            for doc in cursor:
                results.append({
                    "id": doc["_id"],
                    "title": doc.get("title", ""),
                    "created_at": doc.get("created_at", ""),
                    "updated_at": doc.get("updated_at", ""),
                    "is_archived": doc.get("is_archived", False),
                    "messages": []
                })
        else:
            with _in_memory_lock:
                for doc in _in_memory_store.values():
                    if doc.get("is_archived", False):
                        continue
                    if query.lower() in doc.get("title", "").lower():
                        results.append({
                            "id": doc["_id"],
                            "title": doc.get("title", ""),
                            "created_at": doc.get("created_at", ""),
                            "updated_at": doc.get("updated_at", ""),
                            "is_archived": doc.get("is_archived", False),
                            "messages": []
                        })

        return results

    @staticmethod
    def add_run(conversation_id: str, run_id: str, query: str, answer: str, sources: Optional[List[Dict]] = None):
        """Append a new run (user query + assistant response + sources) to a conversation"""
        now = datetime.now().isoformat()
        run_entry = {
            "run_id": run_id,
            "query": query,
            "answer": answer,
            "sources": sources or [],
            "timestamp": now
        }
        if DB_AVAILABLE and conversations_collection is not None:
            conversations_collection.update_one(
                {"_id": conversation_id},
                {
                    "$push": {"runs": run_entry},
                    "$set": {"updated_at": now}
                }
            )
        else:
            with _in_memory_lock:
                doc = _in_memory_store.get(conversation_id)
                if not doc:
                    return
                doc.setdefault("runs", []).append(run_entry)
                doc["updated_at"] = now