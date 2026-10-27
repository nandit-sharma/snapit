
import uuid

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
)
import logging
import uuid

logger = logging.getLogger(__name__)
from app.api.dependencies import get_current_user, require_roles
from app.database.database import supabase
from app.ai.vision import analyze_image
from app.agent.agent import process_complaint
from app.services.complaint_service import (
    get_complaint,
    get_complaint_history,
)

router = APIRouter(prefix="/complaints", tags=["Complaints"])


def authorize_complaint_access(
    complaint: dict,
    current_user: dict,
) -> None:
    """Check whether the authenticated user may access a complaint."""

    role = current_user["role"]
    user_id = str(current_user["id"])

    if role == "admin":
        return

    if role == "student" and str(complaint["user_id"]) == user_id:
        return

    if role == "staff" and str(complaint.get("assigned_to")) == user_id:
        return

    raise HTTPException(
        status_code=403,
        detail="You do not have permission to access this complaint",
    )


@router.post("/")
def create_complaint(
    complaint: dict,
    current_user: dict = Depends(require_roles("student")),
):
    """Create a complaint using the authenticated student's identity."""

    try:
        # Never trust user_id, status, or other protected fields
        # supplied by the client.
        allowed_fields = {
            "department_id",
            "location_id",
            "image_url",
            "issue_type",
            "description",
            "severity",
            "ai_analysis",
        }

        complaint_data = {
            key: value
            for key, value in complaint.items()
            if key in allowed_fields
        }

        complaint_data["user_id"] = current_user["id"]
        complaint_data["status"] = "submitted"

        response = (
            supabase.table("complaints")
            .insert(complaint_data)
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=500,
                detail="Complaint was not saved",
            )

        return {
            "message": "Complaint created successfully",
            "complaint": response.data[0],
        }

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Failed to create complaint",
        )


@router.post("/upload")
async def upload_image(
    file: UploadFile = File(...),
    location_id: str | None = Form(None),
    current_user: dict = Depends(require_roles("student")),
):
    """Upload an image and create a complaint for the logged-in student."""

    try:
        file_data = await file.read()

        if not file_data:
            raise HTTPException(
                status_code=400,
                detail="Uploaded file is empty",
            )

        content_type = file.content_type
        allowed_types = {
            "image/jpeg": "jpg",
            "image/png": "png",
            "image/webp": "webp",
        }

        if content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail="Only JPEG, PNG and WebP images are supported",
            )

        ext = allowed_types[content_type]
        file_path = f"complaints/{uuid.uuid4()}.{ext}"

        supabase.storage.from_("complaint-images").upload(
            file_path,
            file_data,
            {"content-type": content_type},
        )

        image_url = supabase.storage.from_(
            "complaint-images"
        ).get_public_url(file_path)

        # AI vision analysis and agent orchestration
        ai_analysis = analyze_image(file_data)
        ai_analysis = process_complaint(ai_analysis)

        department_name = ai_analysis.get(
            "category", "General Maintenance"
        )

        department_response = (
            supabase.table("departments")
            .select("id")
            .eq("name", department_name)
            .limit(1)
            .execute()
        )

        if department_response.data:
            department_id = department_response.data[0]["id"]
        else:
            fallback = (
                supabase.table("departments")
                .select("id")
                .eq("name", "General Maintenance")
                .limit(1)
                .execute()
            )

            if not fallback.data:
                raise HTTPException(
                    status_code=500,
                    detail="General Maintenance department not found",
                )

            department_id = fallback.data[0]["id"]

        complaint_data = {
            # Identity comes from the verified access token.
            "user_id": current_user["id"],
            "department_id": department_id,
            "image_url": image_url,
            "issue_type": ai_analysis.get("issue", "Campus issue"),
            "description": ai_analysis.get("description", ""),
            "severity": str(
                ai_analysis.get("severity", "medium")
            ).lower(),
            "status": "submitted",
            "ai_analysis": ai_analysis,
        }

        if location_id:
            complaint_data["location_id"] = location_id

        saved = (
            supabase.table("complaints")
            .insert(complaint_data)
            .execute()
        )

        if not saved.data:
            raise HTTPException(
                status_code=500,
                detail="Complaint was not saved",
            )

        return {
            "message": "Complaint submitted successfully",
            "complaint": saved.data[0],
        }

    except HTTPException:
        raise
    except Exception:
        logger.exception("Failed to upload image or process complaint")
        raise HTTPException(
            status_code=500,
            detail="Failed to upload image or process complaint",
        )
    finally:
        await file.close()


@router.get("/{complaint_id}/history")
def complaint_history(
    complaint_id: str,
    current_user: dict = Depends(get_current_user),
):
    complaint = get_complaint(complaint_id)
    authorize_complaint_access(complaint, current_user)

    return {
        "complaint_id": complaint_id,
        "history": get_complaint_history(complaint_id),
    }


@router.get("/{complaint_id}")
def complaint_details(
    complaint_id: str,
    current_user: dict = Depends(get_current_user),
):
    complaint = get_complaint(complaint_id)
    authorize_complaint_access(complaint, current_user)
    return complaint
