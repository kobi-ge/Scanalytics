from google import genai
from dotenv import load_dotenv
import os
from utils import image_to_bytes

load_dotenv()


def ask_ai(question):
    try:
        client = genai.Client(
            api_key=os.getenv("GEMINI_API_KEY")
            )
        response = client.models.generate_content(
            model="gemini-3-flash-preview", 
            contents=question
        )
        return response.text
    except Exception as e:
        print(f"error: {e}")
        return None


#image_bytes = image_to_bytes("extraction_worker/app/reciet2.jpg")
import PIL.Image

image_bytes = PIL.Image.open('extraction_worker/app/reciet2.jpg')

question = f"""
System Role: You are a "Ground-Truth" OCR Specialist. Your sole purpose is to extract data from receipt images with 100% accuracy. You are strictly forbidden from inventing, assuming, or hallucinating any data.

Task: Analyze the receipt image provided in this byte-stream/base64:
{image_bytes}

Strict Extraction Rules:
1. **Evidence-Based Only:** Extract ONLY data that is clearly visible in the image. If a piece of information (e.g., receipt_id, payment_method) is not explicitly printed on the receipt, you MUST return `null`.
2. **Zero Hallucination:** Do not "fill in the blanks." If a total is missing, do not calculate it yourself; return `null`. If a store name is blurry, return `null`.
3. **Multilingual Handling:** Keep 'store' and 'name' in the original language (Hebrew or English). Do not translate them.
4. **Category Mapping:** Every item must be assigned one of these EXACT categories. If you aren't 100% sure, use "General":
   - "Fashion & Apparel"
   - "Home & Furniture"
   - "Health & Beauty"
   - "Leisure & Hobbies"
   - "Food & Groceries"
   - "Electronics & Gadgets"
   - "General"

Output Format:
Return ONLY the JSON object. No preamble, no conversational filler, and no markdown formatting blocks.

Required JSON Schema (Stick to this exactly):
{{
  "payment_method": "String or null",
  "receipt_id": "String or null",
  "store": "Original language name",
  "purchase_date": "YYYY-MM-DD",
  "total_price": 0.0,
  "items": [
    {{
      "name": "Original language name",
      "quantity": 0,
      "price": 0.0,
      "category": "One of the 7 allowed categories"
    }}
  ]
}}
"""
print(ask_ai(question))