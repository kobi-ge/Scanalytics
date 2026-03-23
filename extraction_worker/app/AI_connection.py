from google import genai
from dotenv import load_dotenv
import os

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

print(ask_ai("What is the capital of France?"))