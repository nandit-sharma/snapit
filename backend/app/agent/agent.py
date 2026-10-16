
from datetime import datetime, timezone

from app.agent.router import route_complaint
from app.agent.tools import assess_priority


def process_complaint(ai_analysis: dict) -> dict:
    """Run complaint agents and record their decisions."""

    issue = str(ai_analysis.get("issue", "Campus issue"))
    description = str(ai_analysis.get("description", ""))
    original_category = str(ai_analysis.get("category", ""))
    original_severity = str(ai_analysis.get("severity", "medium"))

    routing = route_complaint(ai_analysis)

    priority = assess_priority(
        severity=original_severity,
        issue=issue,
        description=description,
    )

    department = routing["department"]

    # Keep the original AI output and add an audit record.
    result = {
        **ai_analysis,
        "category": department,
        "severity": priority["severity"],
        "agent_decisions": {
            "department": department,
            "routing_reason": routing["routing_reason"],
            "safety_flag": priority["safety_flag"],
            "requires_urgent_review": (
                priority["requires_urgent_review"]
            ),
            "decision_log": {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "original_category": original_category,
                "original_severity": original_severity,
                "final_category": department,
                "final_severity": priority["severity"],
                "agents_executed": [
                    "department_routing",
                    "priority_assessment",
                ],
            },
        },
    }

    return result
