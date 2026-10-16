VISION_PROMPT = """
Inspect this campus maintenance image.
Identify the single most important visible problem.
Do not speculate about damage that cannot be seen.

Return one JSON object only, with no reasoning:
{
  "issue": "short problem name",
  "category": "Electrical Maintenance",
  "severity": "low",
  "description": "one short sentence",
  "confidence": 0.9
}

Choose category from:
Electrical Maintenance, Civil Maintenance, Plumbing,
Furniture Maintenance, Cleaning & Sanitation, IT & Networking,
General Maintenance.

Choose severity from: low, medium, high, critical.
Set confidence to a number from 0.0 to 1.0.
"""