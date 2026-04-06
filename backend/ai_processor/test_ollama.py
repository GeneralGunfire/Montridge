import requests

OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "llama3.2:3b"

prompt = "Hello world"

try:
    response = requests.post(
        OLLAMA_URL,
        json={
            "model": OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False
        },
        timeout=60
    )
    print("Status code:", response.status_code)
    print("Response:", response.text)
except Exception as e:
    print("Error:", e)
