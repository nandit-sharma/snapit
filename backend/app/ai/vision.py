import base64
import json
import logging
import os
from io import BytesIO

import requests
from PIL import Image

from app.ai.prompts import VISION_PROMPT

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

    for num_predict in (1024, 2048):
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": MODEL,
                "prompt": VISION_PROMPT,
                "images": [image_base64],
                "stream": False,
                "format": "json",
                "think": False,
                "options": {
                    "num_predict": num_predict,
                    "num_ctx": 4096,
                    "temperature": 0,
                },
            },
            timeout=180,
        )

        response.raise_for_status()
        data = response.json()
        result = data.get("response", "")
        done_reason = data.get("done_reason")

        if isinstance(result, str):
            result = result.strip()
        else:
            result = ""

        if not result or done_reason == "length":
            try:
                parsed_result = json.loads(result) if result else None
            except json.JSONDecodeError:
                parsed_result = None

            if isinstance(parsed_result, dict):
                return parsed_result

            if done_reason == "length" and num_predict < 2048:
                logger.warning(
                    "Ollama output was truncated at %s tokens; retrying with "
                    "a larger output limit",
                    num_predict,
                )
                continue

            raise ValueError(
                "Ollama returned incomplete output "
                f"(done_reason={done_reason}, num_predict={num_predict})"
            )

        try:
            parsed_result = json.loads(result)
        except json.JSONDecodeError as exc:
            raise ValueError(
                f"Ollama returned invalid JSON: {result[:500]}"
            ) from exc

        if not isinstance(parsed_result, dict):
            raise ValueError("Ollama returned JSON that is not an object")

        return parsed_result

    raise ValueError("Ollama did not return a complete analysis")
