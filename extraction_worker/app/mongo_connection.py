from pymongo import MongoClient, errors
import os
import gridfs
from bson.objectid import ObjectId




class MongoConnection:
    def __init__(self, logger):
        self.mongo_uri = os.getenv("MONGO_URI")
        self.logger = logger

    def connect(self):
        try:
            self.client = MongoClient(self.mongo_uri)
            print(self.client.admin.command("ping"))
            self.logger.info("connection with mongo established")
        except errors.ConnectionFailure as e:
            self.logger.error(f"error connecting to mongo: {e}")

    def create_collection(self):
        try:
            self.db = self.client["files_db"]
            self.collection = self.db['files_collection']
            self.fs = gridfs.GridFS(self.db)
            self.logger.info("collection created")
            return self.collection
        except errors.PyMongoError as e:
            self.logger.error(f"error creating collection: {e}")

    def insert(self, data):
        try: 
            self.collection.insert_one(data)
            self.logger.info(f"data: {data} inserted to mongo successfully")
        except errors.PyMongoError as e:
            self.logger.error(f"error inserting to mongo collection: {e}")

    def get_from_gridfs(self, file_id):
        try:
            # GridFS expects an ObjectId, so we convert the string before fetching!
            grid_out = self.fs.get(ObjectId(file_id))
            self.logger.info(f"Fetched image bytes from GridFS for ID: {file_id}")
            return grid_out.read()
        except errors.PyMongoError as e:
            self.logger.error(f"Error fetching from GridFS: {e}")
            return None
