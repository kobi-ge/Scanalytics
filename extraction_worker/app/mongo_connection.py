from pymongo import MongoClient, errors
import logging




class MongoConnection:
    def __init__(self, host, port, logger):
        self.host = host
        self.port = port
        self.logger = logger
        self.uri = f"mongodb://{self.host}:{self.port}"

    def connect(self):
        try:
            self.client = MongoClient(self.uri)
            print(self.client.admin.command("ping"))
            self.logger.info("connection with mongo established")
        except errors.ConnectionFailure as e:
            self.logger.error(f"error connecting to mongo: {e}")

    def create_collection(self):
        try:
            self.db = self.client['db']
            self.collection = self.db['coll']
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

