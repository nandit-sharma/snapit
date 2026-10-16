
from datetime import datetime, timezone

from app.agent.router import route_complaint
from app.agent.tools import assess_priority


VALID_DEPARTMENTS = {
    "Electrical Maintenance",
    "Civil Maintenance",
    "Plumbing",
    "Cleaning & Sanitation",
    "Furniture Maintenance",
    "IT & Networking",
    "General Maintenance",
}

VALID_SEVERITIES = {"low", "medium", "high", "critical"}

CONFIDENCE_LEVELS = {
    "high": 0.9,
    "medium": 0.6,
    "low": 0.3,
}


def get_confidence_score(value):
    """Convert supported confidence formats into a numeric score."""
    if isinstance(value, bool):
        return None

    if isinstance(value, (int, float)):
        score = float(value)
        return score if 0.0 <= score <= 1.0 else None

    if isinstance(value, str):
        value = value.strip().lower()

        if value in CONFIDENCE_LEVELS:
            return CONFIDENCE_LEVELS[value]

        try:
            score = float(value)
            return score if 0.0 <= score <= 1.0 else None
        except ValueError:
            return None

    return None


def process_complaint(ai_analysis: dict) -> dict:
    """Validate agent outputs, handle failures, and log decisions."""

    if not isinstance(ai_analysis, dict):
        ai_analysis = {}

    warnings = []
    agent_status = {}

    issue = str(ai_analysis.get("issue") or "").strip()
    description = str(ai_analysis.get("description") or "").strip()
    original_category = ai_analysis.get("category")
    original_severity = ai_analysis.get("severity")
    confidence_score = get_confidence_score(
        ai_analysis.get("confidence")
    )

    # 1. Validate issue information and model confidence.
    if not issue or issue.lower() == "unknown":
        issue = "Campus issue"
        warnings.append("Issue classification is missing or unclear.")

    if confidence_score is None:
        warnings.append("Confidence score is missing or invalid.")
    elif confidence_score < 0.5:
        warnings.append("AI confidence is low.")

    # 2. Run department-routing agent.
    try:
        routing = route_complaint({
            **ai_analysis,
            "issue": issue,
            "description": description,
        })

        department = routing.get("department")

        if department not in VALID_DEPARTMENTS:
            department = "General Maintenance"
            agent_status["department_routing"] = (
                "invalid_output_fallback"
            )
            warnings.append(
                "Invalid department output; used General Maintenance."
            )
        else:
            agent_status["department_routing"] = "success"

        routing_reason = str(
            routing.get("routing_reason") or
            "Fallback department selected."
        )

    except Exception:
        department = "General Maintenance"
        routing_reason = "Routing agent failed; fallback selected."
        agent_status["department_routing"] = "failed_fallback"
        warnings.append("Department routing failed.")

    # 3. Run priority and safety agent.
    try:
        priority = assess_priority(
            severity=str(original_severity or "medium"),
            issue=issue,
            description=description,
        )

        severity = priority.get("severity")
        safety_flag = priority.get("safety_flag")
        urgent_review = priority.get("requires_urgent_review")

        if severity not in VALID_SEVERITIES:
            severity = "medium"
            agent_status["priority_assessment"] = (
                "invalid_output_fallback"
            )
            warnings.append("Invalid severity; used medium.")
        else:
            agent_status["priority_assessment"] = "success"

        if not isinstance(safety_flag, bool):
            safety_flag = True
            warnings.append(
                "Safety output invalid; human review required."
            )

        if not isinstance(urgent_review, bool):
            urgent_review = True
            warnings.append(
                "Urgent-review output invalid; human review required."
            )

    except Exception:
        severity = "medium"
        safety_flag = True
        urgent_review = True
        agent_status["priority_assessment"] = "failed_safe_fallback"
        warnings.append(
            "Priority agent failed; human safety review required."
        )

    # 4. Determine whether human review is necessary.
    uncertainty = (
        not issue
        or confidence_score is None
        or (
            confidence_score is not None
            and confidence_score < 0.5
        )
    )

    human_review_required = (
        uncertainty
        or safety_flag
        or urgent_review
        or any(
            status != "success"
            for status in agent_status.values()
        )
    )

    # 5. Return final classification and audit log.
    result = {
        **ai_analysis,
        "issue": issue,
        "description": description,
        "category": department,
        "severity": severity,
        "agent_decisions": {
            "department": department,
            "routing_reason": routing_reason,
            "safety_flag": safety_flag,
            "requires_urgent_review": urgent_review,
            "human_review_required": human_review_required,
            "decision_log": {
                "timestamp": datetime.now(
                    timezone.utc
                ).isoformat(),
                "original_category": original_category,
                "original_severity": original_severity,
                "final_category": department,
                "final_severity": severity,
                "confidence_score": confidence_score,
                "agents_executed": [
                    "department_routing",
                    "priority_assessment",
                ],
                "agent_status": agent_status,
                "warnings": warnings,
            },
        },
    }

    return result
