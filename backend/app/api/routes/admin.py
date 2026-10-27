
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.api.dependencies import require_roles
from app.database.database import supabase
from app.services.complaint_service import update_complaint_status

router = APIRouter(prefix="/admin", tags=["Admin"])


class StatusUpdate(BaseModel):
    status: str
    comment: str | None = Field(default=None, max_length=1000)


@router.get("/complaints")
def list_complaints(
    current_user: dict = Depends(require_roles("admin")),
):
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
