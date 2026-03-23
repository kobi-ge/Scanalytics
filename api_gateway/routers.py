from fastapi import APIRouter, File, UploadFile

from models import ManualEntryRequest
from mongodb import mongo_helper
from kafka_producer import kafka_helper

router = APIRouter()

@router.post("/upload-receipt")
def upload_receipt(file: UploadFile = File(...)):
    # Read the file synchronously
    file_content = file.file.read()
    
    # Save the raw file to MongoDB GridFS
    file_id = mongo_helper.save_file(
        file_data=file_content, 
        filename=file.filename, 
        content_type=file.content_type
    )
    
    # Send a message to Kafka topic 'images'
    message_data = {
        "file_id": file_id,
        "filename": file.filename,
        "content_type": file.content_type,
        "status": "uploaded"
    }
    kafka_helper.send_message("images", message_data)
    
    return {"message": "Receipt uploaded successfully", "file_id": file_id}

@router.post("/manual-entry")
def manual_entry(entry: ManualEntryRequest):
    # Send the JSON data directly to Kafka topic 'data'
    message_data = {
        "payload": entry.data
    }
    kafka_helper.send_message("data", message_data)
    
    return {"message": "Manual entry received and sent to Kafka"}
