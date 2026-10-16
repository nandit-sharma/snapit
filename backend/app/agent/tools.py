
DEPARTMENT_MAP = {
    "electrical": "Electrical Maintenance",
    "fan": "Electrical Maintenance",
    "light": "Electrical Maintenance",
    "wiring": "Electrical Maintenance",
    "socket": "Electrical Maintenance",
    "plumbing": "Plumbing",
    "tap": "Plumbing",
    "pipe": "Plumbing",
    "leak": "Plumbing",
    "water": "Plumbing",
    "furniture": "Furniture Maintenance",
    "chair": "Furniture Maintenance",
    "desk": "Furniture Maintenance",
    "table": "Furniture Maintenance",
    "wall": "Civil Maintenance",
    "ceiling": "Civil Maintenance",
    "floor": "Civil Maintenance",
    "crack": "Civil Maintenance",
    "paint": "Civil Maintenance",
    "garbage": "Cleaning & Sanitation",
    "waste": "Cleaning & Sanitation",
    "dirty": "Cleaning & Sanitation",
    "network": "IT & Networking",
    "internet": "IT & Networking",
    "computer": "IT & Networking",
}

VALID_SEVERITIES = {"low", "medium", "high", "critical"}

SAFETY_KEYWORDS = (
    "fire",
    "smoke",
    "sparking",
    "exposed wire",
    "electric shock",
    "gas leak",
    "collapse",
    "structural damage",
    "structural crack",
    "large crack",
    "deep crack",
    "hanging fan",
    "falling ceiling",
)


def select_department(issue: str, category: str) -> str:
    """Choose a department using the AI category and issue description."""
    allowed_departments = {
        "Electrical Maintenance",
        "Civil Maintenance",
        "Plumbing",
        "Cleaning & Sanitation",
        "Furniture Maintenance",
        "IT & Networking",
        "General Maintenance",
    }

    if category in allowed_departments:
        return category

    text = issue.lower()

    for keyword, department in DEPARTMENT_MAP.items():
        if keyword in text:
            return department

    return "General Maintenance"


def assess_priority(
    severity: str,
    issue: str,
    description: str,
) -> dict:
    """Validate severity and flag possible safety hazards."""
    severity = severity.lower().strip()

    if severity not in VALID_SEVERITIES:
        severity = "medium"

    text = f"{issue} {description}".lower()
    safety_flag = any(
        keyword in text for keyword in SAFETY_KEYWORDS
    )

    if safety_flag and severity in {"low", "medium"}:
        severity = "high"

    return {
        "severity": severity,
        "safety_flag": safety_flag,
        "requires_urgent_review": (
            safety_flag or severity == "critical"
        ),
    }
