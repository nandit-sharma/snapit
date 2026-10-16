
from fastapi import APIRouter

from app.database.database import supabase
from app.services.complaint_service import get_user_complaints

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/{user_id}/complaints")
def list_user_complaints(user_id: str):
    return {
        "user_id": user_id,
        "complaints": get_user_complaints(user_id),
    }


@router.get("/{user_id}")
def get_user(user_id: str):
    response = (
        supabase.table("users")
        .select("id, name, email, role, created_at")
        .eq("id", user_id)
        .limit(1)
        .execute()
    )

    if not response.data:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="User not found")

    return response.data[0]
