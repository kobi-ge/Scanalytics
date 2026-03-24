FROM python:3.11-slim

WORKDIR /app

# Install dependencies before copying the code to leverage Docker cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire app folder
COPY app/ ./app/

# Set working directory to the app folder so sibling imports work properly
WORKDIR /app/app

# -u forces unbuffered stdout so logs appear immediately
CMD ["python", "-u", "main.py"]