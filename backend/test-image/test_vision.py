import base64
import requests

IMAGE_PATH = r"C:\Users\PC\Desktop\snapit\backend\test-image\img2.webp"

with open(IMAGE_PATH, "rb") as image:
    image_base64 = base64.b64encode(image.read()).decode("utf-8")

prompt = """
You are an AI system for a college campus complaint application.

Analyze this image specifically to identify the PRIMARY campus maintenance
problem that should be reported.

Important rules:
- Look at the entire image carefully.
- Identify damaged, broken, unsafe, or malfunctioning objects.
- Prioritize functional or safety-related problems over cosmetic issues
  such as paint peeling.
- If a damaged object is clearly visible, identify that object as the
  primary issue.
- Do not choose a minor cosmetic issue when a more important damaged
  object is present.

Return ONLY valid JSON in this format:

{
  "issue": "short name of the primary problem",
  "category": "Electrical Maintenance / Civil Maintenance / Plumbing / Furniture Maintenance / Cleaning & Sanitation / IT & Networking / General Maintenance",
  "severity": "low / medium / high / critical",
  "description": "short explanation of the problem",
  "confidence": 0.0
}
"""

response = requests.post(
    "http://localhost:11434/api/generate",
    json={
        "model": "qwen3-vl:4b",
        "prompt": prompt,
        "images": [image_base64],
        "stream": False
    }
)

print(response.json()["response"])