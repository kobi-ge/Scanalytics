import os
import json
import re
from llama_index.readers.llama_parse import LlamaParse
from dotenv import load_dotenv
from rich import print as rprint

load_dotenv()

def parse_to_json(image_path):
    # 1. הגדרת הפרומפט כ-System Prompt קשיח
    prompt = """
    DO NOT return any text other than a valid JSON object. 
    Task: Extract data from the receipt image.
    
    Rules:
    - If a field is missing, return null.
    - Dates must be YYYY-MM-DD.
    - Prices and quantities must be numbers (float/int).
    - Category must be ONE of: "Fashion & Apparel", "Home & Furniture", "Health & Beauty", "Leisure & Hobbies", "Food & Groceries", "Electronics & Gadgets", "General".
    
    Format:
    {
      "payment_method": "String or null",
      "receipt_id": "String or null",
      "store": "Original language",
      "purchase_date": "YYYY-MM-DD",
      "total_price": 0.0,
      "items": [
        {
          "name": "Original language",
          "quantity": 0,
          "price": 0.0,
          "category": "One of the 7 categories"
        }
      ]
    }
    """

    parser = LlamaParse(
        api_key=os.getenv("LLAMA_CLOUD_API_KEY"),
        result_type="markdown",
        system_prompt=prompt, # כאן המפתח לשינוי
        verbose=True
    )

    # 2. הרצת הפענוח
    documents = parser.load_data(image_path)
    if not documents:
        return None

    raw_text = documents[0].text

    # 3. ניקוי ה-JSON (למקרה ש-LlamaParse מוסיף ```json)
    json_match = re.search(r'\{.*\}', raw_text, re.DOTALL)
    json_str = json_match.group(0) if json_match else raw_text
    
    try:
        return json.loads(json_str)
    except json.JSONDecodeError:
        return None



img_p = "extraction_worker/app/reciet2.jpg"
rprint(parse_to_json(img_p))