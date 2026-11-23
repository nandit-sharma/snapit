from fastapi import HTTPException
from app.database.database import supabase

VALID_STATUSES = {
    "submitted",
    "under_review",
    "assigned",
    "in_progress",
    "resolved",
    "rejected",
}

SELECT_FIELDS = "*, departments(id, name), users!complaints_user_id_fkey(name, email)"


def format_complaint(c: dict) -> dict:
    if not isinstance(c, dict):
        return c
    dept = c.get("departments")
    user = c.get("users")
    if isinstance(dept, dict) and "name" in dept:
        c["department_name"] = dept["name"]
    elif "department_name" not in c or not c["department_name"]:
        c["department_name"] = "General Maintenance"

    if isinstance(user, dict):
        c["userName"] = user.get("name")
        c["userEmail"] = user.get("email")
    return c


def get_complaint(complaint_id: str) -> dict:
    response = (
        supabase.table("complaints")
        .select(SELECT_FIELDS)
        .eq("id", complaint_id)
        .limit(1)
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=404,
            detail="Complaint not found",
        )

    return format_complaint(response.data[0])


def get_user_complaints(user_id: str) -> list:
    response = (
        supabase.table("complaints")
        .select(SELECT_FIELDS)
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )

    return [format_complaint(c) for c in (response.data or [])]


def get_complaint_history(complaint_id: str) -> list:
    get_complaint(complaint_id)

    response = (
        supabase.table("complaint_updates")
        .select("*")
        .eq("complaint_id", complaint_id)
        .order("created_at", desc=False)
        .execute()
    )

    rows = response.data or []

    # Normalise each history row so the frontend receives a `status` field.
    # The DB stores old_status / new_status; the app Timeline expects `status`.
    normalised = []
    for row in rows:
        new_s = row.get("new_status") or row.get("old_status") or "submitted"
        normalised.append({
            **row,
            "status": new_s,
            # Keep old_status / new_status as well for future use
        })

    return normalised


def update_complaint_status(
    complaint_id: str,
    new_status: str,
    updated_by: str,
    comment: str | None = None,
) -> dict:
    if new_status not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Choose from: {sorted(VALID_STATUSES)}",
        )

    current = get_complaint(complaint_id)
    old_status = current["status"]

    if old_status == new_status and not comment:
        return current

    updated = (
        supabase.table("complaints")
        .update({"status": new_status})
        .eq("id", complaint_id)
        .execute()
    )

    if not updated.data:
        raise HTTPException(
            status_code=500,
            detail="Failed to update complaint status",
        )

    try:
        supabase.table("complaint_updates").insert({
            "complaint_id": complaint_id,
            "updated_by": updated_by,
            "old_status": old_status,
            "new_status": new_status,
            "comment": comment,
        }).execute()
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Complaint status was updated, but history logging failed. "
                "Check complaint_updates before retrying."
            ),
        ) from exc

    return get_complaint(complaint_id)
