from app.agent.tools import select_department


def route_complaint(ai_analysis: dict) -> dict:
    """Determine which department should receive the complaint."""
    issue = str(ai_analysis.get("issue", "Campus issue"))
    category = str(ai_analysis.get("category", ""))

    department = select_department(issue, category)

    return {
        "department": department,
        "routing_reason": (
            f"Selected {department} based on the detected issue "
            f"and AI category."
        ),
    }
