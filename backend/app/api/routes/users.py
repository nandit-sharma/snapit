from fastapi import APIRouter, Depends, HTTPException

from app.api.dependencies import get_current_user
from app.services.complaint_service import get_user_complaints

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me")
def get_my_profile(
    current_user: dict = Depends(get_current_user),
):
    return current_user


@router.get("/{user_id}/complaints")
def list_user_complaints(
    user_id: str,
    current_user: dict = Depends(get_current_user),
):
    # Students can access only their own complaints.
    if (
        current_user["role"] == "student"
        and str(current_user["id"]) != user_id
    ):
        raise HTTPException(
            status_code=403,
            detail="You can only view your own complaints",
        )

    # Staff/admin access will be refined with role-specific rules.
    if current_user["role"] not in {"student", "staff", "admin"}:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to view complaints",
        )

    return {
        "user_id": user_id,
        "complaints": get_user_complaints(user_id),
    }