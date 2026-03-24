import os
import json

def image_to_bytes(image_path: str) -> bytes:
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found: {image_path}")

    with open(image_path, "rb") as f:
        return f.read()

def extract_file_id(msg: str):
    """
    Parses an incoming JSON payload string and extracts its file_id.
    Returns the file_id if successful, or None if it fails.
    """
    try:
        payload = json.loads(msg)
        file_id = payload.get("file_id")
        if not file_id:
            print(f"❌ Missing file_id in payload: {payload}")
            return None
        return file_id
    except json.JSONDecodeError:
        print(f"❌ Could not decode JSON from message: {msg}")
        return None
