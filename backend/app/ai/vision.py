import base64
import json
import requests

from app.ai.prompts import VISION_PROMPT


OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "qwen3-vl:4b"


def analyze_image(image_data: bytes):
    image_base64 = base64.b64encode(image_data).decode("utf-8")

    response = requests.post(
        OLLAMA_URL,
        json={
            "model": MODEL,
            "prompt": VISION_PROMPT,
            "images": [image_base64],
            "stream": False
        },
        timeout=120
    )

    response.raise_for_status()

    result = response.json()["response"]

    return json.loads(result)