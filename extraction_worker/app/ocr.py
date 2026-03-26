import os
import json
import re
import tempfile
import html
from llama_index.readers.llama_parse import LlamaParse
from dotenv import load_dotenv
from rich import print as rprint

load_dotenv()

def parse_to_json(image_bytes):
    # 1. Define the system prompt for strict JSON output
    prompt = """
    DO NOT return any text other than a valid JSON object. 
    Task: Extract data from the receipt image.
    
    Rules:
    - If a field is missing, return null.
    - Dates must be YYYY-MM-DD.
    - Prices and quantities must be numbers (float/int).
    - Category must be ONE of: "Fashion & Apparel", "Home & Furniture", "Health & Beauty", "Leisure & Hobbies", "Food & Groceries", "Electronics & Gadgets", "General".
    - payment_method must be normalized to either "Visa" or "Cash".
    - "Visa" should be used for any card payments (VISA, visa, Mastercard, Debit, Credit, Amex, Card, etc.).
    - "Cash" should be used for cash payments (Cash, cash, Money, money).
    
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
        system_prompt=prompt, # Injecting the strict prompt here
        verbose=True
    )

    temp_file_path = ""
    try:
        # On Windows, we must use delete=False and close the file before another library can open it
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as temp_file:
            temp_file.write(image_bytes)
            temp_file.flush()
            temp_file_path = temp_file.name

        # 2. Run the parsing
        documents = parser.load_data(temp_file_path)
    finally:
        # 3. Clean up manually since we bypassed delete=True
        if temp_file_path and os.path.exists(temp_file_path):
            os.remove(temp_file_path)

    if not documents:
        return None

    raw_text = documents[0].text

    # 3. Clean up JSON (in case LlamaParse adds markdown blocks)
    json_match = re.search(r'\{.*\}', raw_text, re.DOTALL)
    json_str = json_match.group(0) if json_match else raw_text
    
    json_str = html.unescape(json_str)
    
    try:
        return json.loads(json_str)
    except json.JSONDecodeError:
        return None
