
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


def get_complaint(complaint_id: str) -> dict:
    response = (
        supabase.table("complaints")
        .select("*")
        .eq("id", complaint_id)
        .limit(1)
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=404,
            detail="Complaint not found",
        )

    return response.data[0]


def get_user_complaints(user_id: str) -> list:
    response = (
        supabase.table("complaints")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )

    return response.data


def get_complaint_history(complaint_id: str) -> list:
    # Confirm the complaint exists first.
    get_complaint(complaint_id)

    response = (
        supabase.table("complaint_updates")
        .select("*")
        .eq("complaint_id", complaint_id)
        .order("created_at", desc=False)
        .execute()
    )

    return response.data


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

    if old_status == new_status:
        return current

    # Update the complaint first.
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

    # Record the status change.
    try:
        supabase.table("complaint_updates").insert({
            "complaint_id": complaint_id,
            "updated_by": updated_by,
            "old_status": old_status,
            "new_status": new_status,
            "comment": comment,
        }).execute()
    except Exception as exc:
        # The complaint status has already changed. Make the partial
        # success explicit instead of pretending the history was saved.
        raise HTTPException(
            status_code=500,
            detail=(
                "Complaint status was updated, but history logging failed. "
                "Check complaint_updates before retrying."
            ),
        ) from exc

    return updated.data[0]
