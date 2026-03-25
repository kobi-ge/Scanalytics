import os
from pymongo import MongoClient
import gridfs

class MongoDBHelper:
    def __init__(self, uri=None, db_name="files_db"):
        if uri is None:
            uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
        self.client = MongoClient(uri)
        self.db = self.client[db_name]
        self.fs = gridfs.GridFS(self.db)
        
    def save_file(self, file_data: bytes, filename: str, content_type: str, user_id: str = None) -> str:
        metadata = {"contentType": content_type}
        if user_id:
            metadata["user_id"] = user_id
        file_id = self.fs.put(file_data, filename=filename, content_type=content_type, metadata=metadata)
        return str(file_id)


mongo_helper = MongoDBHelper()
