import base64
import json
import logging
import os
from io import BytesIO

import requests
from PIL import Image

logger = logging.getLogger(__name__)

OLLAMA_URL = os.getenv(
    "OLLAMA_URL",
    "http://localhost:11434/api/generate"
)
MODEL = os.getenv("OLLAMA_MODEL", "qwen3-vl:4b")


def analyze_image(image_data: bytes) -> dict:
    image = Image.open(BytesIO(image_data)).convert("RGB")
    image.thumbnail((448, 448))

    buffer = BytesIO()
    image.save(buffer, format="JPEG", quality=75)
    image_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

    response = requests.post(
        OLLAMA_URL,
        json={
            "model": MODEL,
            "prompt": (
                "Identify the main visible campus maintenance problem. "
                "Return a JSON object with keys issue, category, severity, "
                "description, confidence. Be concise. No explanation."
            ),
            "images": [image_base64],
            "stream": False,
            "format": "json",
            "think": False,
            "options": {
                "num_predict": 256,
                "num_ctx": 4096,
                "temperature": 0,
            },
        },
        timeout=180,
    )

    response.raise_for_status()
    data = response.json()

    logger.info(
        "Ollama finished: reason=%s, tokens=%s",
        data.get("done_reason"),
        data.get("eval_count"),
    )

    result = data.get("response", "").strip()

    if not result:
        raise ValueError(
            f"Ollama returned empty output: {data.get('done_reason')}"
        )

    try:
        parsed = json.loads(result)
    except json.JSONDecodeError as exc:
        raise ValueError(
            f"Ollama returned invalid JSON: {result[:300]}"
        ) from exc

    if not isinstance(parsed, dict):
        raise ValueError("Ollama returned JSON that is not an object")

    return parsed