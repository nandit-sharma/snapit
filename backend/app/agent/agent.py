
from app.agent.router import route_complaint
from app.agent.tools import assess_priority


def process_complaint(ai_analysis: dict) -> dict:
    """Coordinate routing and priority assessment."""
    issue = str(ai_analysis.get("issue", "Campus issue"))
    description = str(ai_analysis.get("description", ""))
    severity = str(ai_analysis.get("severity", "medium"))

    routing = route_complaint(ai_analysis)

    priority = assess_priority(
        severity=severity,
        issue=issue,
        description=description,
    )

    return {
        **ai_analysis,
        "category": routing["department"],
        "severity": priority["severity"],
        "agent_decisions": {
            "department": routing["department"],
            "routing_reason": routing["routing_reason"],
            "safety_flag": priority["safety_flag"],
            "requires_urgent_review": (
                priority["requires_urgent_review"]
            ),
        },
    }