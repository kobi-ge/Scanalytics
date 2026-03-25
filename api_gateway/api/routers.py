from fastapi import APIRouter, File, UploadFile, Form
import uuid

from api.schemas import ManualEntryRequest
from database.mongodb import mongo_helper
from messaging.kafka_producer import kafka_helper
from logging_system.logger import log_to_elastic
router = APIRouter()

@router.post("/upload-receipt")
def upload_receipt(
    user_id: str = Form(...),
    file: UploadFile = File(...)
):
    # Read the file synchronously
    file_content = file.file.read()
    
    # Save the raw file to MongoDB GridFS
    try:
        file_id = mongo_helper.save_file(
            file_data=file_content, 
            filename=file.filename, 
            content_type=file.content_type,
            user_id=user_id
        )
        log_to_elastic("INFO", f"File {file.filename} saved to MongoDB successfully with ID {file_id}")
    except Exception as e:
        log_to_elastic("ERROR", f"Failed to save file to MongoDB: {e}")
        return {"error": "Failed to upload file"}, 500

    
    # Send a message to Kafka topic 'images'
    message_data = {
        "file_id": file_id,
        "filename": file.filename,
        "content_type": file.content_type,
        "status": "uploaded",
        "user_id": user_id
    }
    try:
        kafka_helper.send_message("images", message_data)
        log_to_elastic("INFO", f"Receipt {file.filename} from user {user_id} uploaded and sent to Kafka successfully")
    except Exception as e:
        log_to_elastic("ERROR", f"Failed to send message to Kafka: {e}")
        
    return {"message": "Receipt uploaded successfully", "file_id": file_id}

@router.post("/manual-entry")
def manual_entry(entry: ManualEntryRequest):
    # Send the JSON data directly to Kafka topic 'data'
    message_data = entry.dict()
    try:
        kafka_helper.send_message("data", message_data)
        log_to_elastic("INFO", f"Manual entry from user {entry.user_id} received and sent to Kafka")
    except Exception as e:
        log_to_elastic("ERROR", f"Failed to send manual entry to Kafka: {e}")
        
    return {"message": "Manual entry received and sent to Kafka"}
