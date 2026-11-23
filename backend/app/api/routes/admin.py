from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.api.dependencies import require_roles
from app.database.database import supabase
from app.services.complaint_service import (
    SELECT_FIELDS,
    format_complaint,
    get_complaint,
    update_complaint_status,
)

router = APIRouter(prefix="/admin", tags=["Admin"])


class StatusUpdate(BaseModel):
    status: str
    comment: str | None = Field(default=None, max_length=1000)


class PriorityUpdate(BaseModel):
    severity: str


class DepartmentUpdate(BaseModel):
    department_id: str


@router.get("/complaints")
def list_complaints(
    current_user: dict = Depends(require_roles("admin")),
):
    response = (
        supabase.table("complaints")
        .select(SELECT_FIELDS)
        .order("created_at", desc=True)
        .execute()
    )

    return {"complaints": [format_complaint(c) for c in (response.data or [])]}


@router.patch("/complaints/{complaint_id}/status")
def change_complaint_status(
    complaint_id: str,
    payload: StatusUpdate,
    current_user: dict = Depends(require_roles("admin")),
):
    complaint = update_complaint_status(
        complaint_id=complaint_id,
        new_status=payload.status,
        updated_by=current_user["id"],
        comment=payload.comment,
    )

    return {
        "message": "Complaint status updated",
        "complaint": complaint,
    }


@router.patch("/complaints/{complaint_id}/priority")
def change_complaint_priority(
    complaint_id: str,
    payload: PriorityUpdate,
    current_user: dict = Depends(require_roles("admin")),
):
    if payload.severity not in {"low", "medium", "high", "critical"}:
        raise HTTPException(status_code=400, detail="Invalid severity")

    updated = (
        supabase.table("complaints")
        .update({"severity": payload.severity})
        .eq("id", complaint_id)
        .execute()
    )
    if not updated.data:
        raise HTTPException(status_code=404, detail="Complaint not found")

    supabase.table("complaint_updates").insert({
        "complaint_id": complaint_id,
        "updated_by": current_user["id"],
        "old_status": updated.data[0]["status"],
        "new_status": updated.data[0]["status"],
        "comment": f"Priority changed to {payload.severity}.",
    }).execute()

    return {
        "message": "Complaint priority updated",
        "complaint": get_complaint(complaint_id),
    }


@router.patch("/complaints/{complaint_id}/department")
def change_complaint_department(
    complaint_id: str,
    payload: DepartmentUpdate,
    current_user: dict = Depends(require_roles("admin")),
):
    department = (
        supabase.table("departments")
        .select("id, name")
        .eq("id", payload.department_id)
        .limit(1)
        .execute()
    )
    if not department.data:
        raise HTTPException(status_code=404, detail="Department not found")

    updated = (
        supabase.table("complaints")
        .update({"department_id": payload.department_id})
        .eq("id", complaint_id)
        .execute()
    )
    if not updated.data:
        raise HTTPException(status_code=404, detail="Complaint not found")

    supabase.table("complaint_updates").insert({
        "complaint_id": complaint_id,
        "updated_by": current_user["id"],
        "old_status": updated.data[0]["status"],
        "new_status": updated.data[0]["status"],
        "comment": f"Complaint reassigned to {department.data[0]['name']}.",
    }).execute()

    return {
        "message": "Complaint department updated",
        "complaint": get_complaint(complaint_id),
    }
