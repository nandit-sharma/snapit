
import base64
import json
import logging
import os
from io import BytesIO

import requests
from PIL import Image, UnidentifiedImageError

logger = logging.getLogger(__name__)

OLLAMA_URL = os.getenv(
    "OLLAMA_URL",
    "http://localhost:11434/api/generate"
)

MODEL = os.getenv("OLLAMA_MODEL", "qwen3-vl:4b")


def analyze_image(image_data: bytes) -> dict:
    """
    Analyze a campus maintenance image using Ollama vision model.
    Returns the AI-generated JSON result.
    """

    try:
        # Validate and prepare image
        if not image_data:
            raise ValueError("Uploaded image is empty")

        try:
            image = Image.open(BytesIO(image_data)).convert("RGB")
        except UnidentifiedImageError as exc:
            raise ValueError("Uploaded file is not a valid image") from exc

        image.thumbnail((448, 448))

        buffer = BytesIO()
        image.save(buffer, format="JPEG", quality=75)

        image_base64 = base64.b64encode(
            buffer.getvalue()
        ).decode("utf-8")

        logger.info(
            "Starting Ollama image analysis: model=%s, image_size=%s",
            MODEL,
            image.size,
        )

        # Send image to Ollama
        try:
            response = requests.post(
                OLLAMA_URL,
                json={
                    "model": MODEL,
                    "prompt": (
                        "You are an AI assistant for a smart campus "
                        "maintenance complaint system.\n\n"
                        "Analyze the uploaded image and identify the "
                        "main visible campus maintenance problem.\n\n"
                        "Return ONLY a valid JSON object with these keys:\n"
                        "{"
                        '"issue": "short issue name", '
                        '"category": "department category", '
                        '"severity": "low, medium, or high", '
                        '"description": "clear description of visible issue", '
                        '"confidence": 0.0'
                        "}\n\n"
                        "Use one of these categories:\n"
                        "- Electrical Maintenance\n"
                        "- Civil Maintenance\n"
                        "- Plumbing\n"
                        "- Cleaning & Sanitation\n"
                        "- Furniture Maintenance\n"
                        "- IT & Networking\n"
                        "- General Maintenance\n\n"
                        "Do not invent problems that are not visible. "
                        "If the image is unclear, explain that in the "
                        "description and use low confidence."
                    ),
                    "images": [image_base64],
                    "stream": False,
                    "format": "json",
                    "think": False,
                    "options": {
                        "num_predict": 768,
                        "num_ctx": 4096,
                        "temperature": 0,
                    },
                },
                timeout=(10.0, 300.0),
            )

            response.raise_for_status()
            data = response.json()
            logger.info("OLLAMA DONE REASON: %s", data.get("done_reason"))
            logger.info("OLLAMA THINKING: %s", data.get("thinking", ""))
            logger.info("OLLAMA RESPONSE: %s", data.get("response", ""))

        except requests.exceptions.Timeout:
            logger.exception("Ollama request timed out")
            raise

        except requests.exceptions.RequestException:
            logger.exception("Ollama API request failed")
            raise

        # Log Ollama response metadata
        logger.info(
            "Ollama finished: reason=%s, eval_tokens=%s",
            data.get("done_reason"),
            data.get("eval_count"),
        )

        result = data.get("response", "").strip()

        logger.info("OLLAMA RAW AI RESPONSE: %s", result)

        if not result:
            raise ValueError(
                f"Ollama returned empty output. "
                f"Done reason: {data.get('done_reason')}"
            )

        # Parse JSON response
        try:
            parsed = json.loads(result)

        except json.JSONDecodeError as exc:
            raise ValueError(
                f"Ollama returned invalid JSON: {result[:500]}"
            ) from exc

        if not isinstance(parsed, dict):
            raise ValueError(
                "Ollama response must be a JSON object"
            )

        required_fields = [
            "issue",
            "category",
            "severity",
            "description",
            "confidence",
        ]

        missing_fields = [
            field for field in required_fields
            if field not in parsed
        ]

        if missing_fields:
            raise ValueError(
                f"Ollama response missing fields: {missing_fields}"
            )

        logger.info(
            "AI analysis successful: issue=%s, category=%s, confidence=%s",
            parsed.get("issue"),
            parsed.get("category"),
            parsed.get("confidence"),
        )

        return parsed

    except Exception:
        logger.exception("OLLAMA IMAGE ANALYSIS FAILED")
        raise
