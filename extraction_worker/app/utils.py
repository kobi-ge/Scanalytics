import os
import json

def image_to_bytes(image_path: str) -> bytes:
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found: {image_path}")

    with open(image_path, "rb") as f:
        return f.read()

def extract_metadata(msg: str):
    """
    Parses an incoming JSON payload string and extracts file_id and user_id.
    Returns (file_id, user_id) if successful, or (None, None) if it fails.
    """
    try:
        payload = json.loads(msg)
        file_id = payload.get("file_id")
        user_id = payload.get("user_id")
        
        if not file_id or not user_id:
            print(f"❌ Missing file_id or user_id in payload: {payload}")
            return None, None
            
        return file_id, user_id
    except json.JSONDecodeError:
        print(f"❌ Could not decode JSON from message: {msg}")
        return None, None
