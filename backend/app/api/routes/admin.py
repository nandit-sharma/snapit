
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.complaint_service import (
    get_complaint,
    update_complaint_status,
)

router = APIRouter(prefix="/admin", tags=["Admin"])


class StatusUpdate(BaseModel):
    status: str
    updated_by: str
    comment: str | None = Field(default=None, max_length=1000)


@router.get("/complaints")
def list_complaints():
    from app.database.database import supabase

    response = (
        supabase.table("complaints")
        .select("*")
        .order("created_at", desc=True)
        .execute()
    )

    return {"complaints": response.data}


@router.patch("/complaints/{complaint_id}/status")
def change_complaint_status(
    complaint_id: str,
    payload: StatusUpdate,
):
    return {
        "message": "Complaint status updated",
        "complaint": update_complaint_status(
            complaint_id=complaint_id,
            new_status=payload.status,
            updated_by=payload.updated_by,
            comment=payload.comment,
        ),
    }
