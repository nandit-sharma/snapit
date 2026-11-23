
import logging
import uuid

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
)
from starlette.concurrency import run_in_threadpool

from app.api.dependencies import get_current_user, require_roles
from app.database.database import supabase
from app.ai.vision import analyze_image
from app.agent.agent import process_complaint
from app.services.complaint_service import (
    get_complaint,
    get_complaint_history,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/complaints", tags=["Complaints"])

VALID_SEVERITIES = {"low", "medium", "high", "critical"}


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


def get_department_id(department_name: str) -> str:
    """Find a department ID, falling back to General Maintenance."""

    response = (
        supabase.table("departments")
        .select("id")
        .eq("name", department_name)
        .limit(1)
        .execute()
    )

    if response.data:
        return response.data[0]["id"]

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

    return fallback.data[0]["id"]


@router.post("/")
def create_complaint(
    complaint: dict,
    current_user: dict = Depends(require_roles("student")),
):
    """Create a complaint using the student's confirmed details."""

    try:
        allowed_fields = {
            "department_id",
            "location_id",
            "image_url",
            "issue_type",
            "description",
            "severity",
            "ai_analysis",
            "latitude",
            "longitude",
        }

        complaint_data = {
            key: value
            for key, value in complaint.items()
            if key in allowed_fields
        }

        required_fields = {
            "department_id",
            "image_url",
            "issue_type",
            "description",
            "severity",
            "ai_analysis",
        }

        missing_fields = [
            field
            for field in required_fields
            if complaint_data.get(field) is None
        ]

        if missing_fields:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required fields: {', '.join(missing_fields)}",
            )

        severity = str(complaint_data["severity"]).lower().strip()

        if severity not in VALID_SEVERITIES:
            raise HTTPException(
                status_code=400,
                detail="Invalid severity. Use low, medium, high, or critical.",
            )

        if not isinstance(complaint_data["ai_analysis"], dict):
            raise HTTPException(
                status_code=400,
                detail="Invalid AI analysis data",
            )

        # Verify that the selected department exists.
        department = (
            supabase.table("departments")
            .select("id")
            .eq("id", complaint_data["department_id"])
            .limit(1)
            .execute()
        )

        if not department.data:
            raise HTTPException(
                status_code=400,
                detail="Selected department does not exist",
            )

        complaint_data["severity"] = severity
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

        saved_complaint = get_complaint(response.data[0]["id"])

        return {
            "message": "Complaint submitted successfully",
            "complaint": saved_complaint,
        }

    except HTTPException:
        raise
    except Exception:
        logger.exception("Failed to create complaint")

        raise HTTPException(
            status_code=500,
            detail="Failed to create complaint",
        )


@router.post("/analyze")
async def analyze_complaint_image(
    file: UploadFile = File(...),
    latitude: float | None = Form(default=None),
    longitude: float | None = Form(default=None),
    current_user: dict = Depends(require_roles("student")),
):
    """
    Upload an image and generate AI predictions.
    Does NOT create a complaint.
    """

    try:
        file_data = await file.read()

        if not file_data:
            raise HTTPException(
                status_code=400,
                detail="Uploaded file is empty",
            )

        content_type = (file.content_type or "").lower()
        filename = (file.filename or "image.jpg").lower()

        if "png" in content_type or filename.endswith(".png"):
            ext = "png"
            final_content_type = "image/png"

        elif "webp" in content_type or filename.endswith(".webp"):
            ext = "webp"
            final_content_type = "image/webp"

        elif (
            "jpeg" in content_type
            or "jpg" in content_type
            or filename.endswith((".jpg", ".jpeg"))
        ):
            ext = "jpg"
            final_content_type = "image/jpeg"

        else:
            raise HTTPException(
                status_code=400,
                detail="Only JPEG, PNG and WebP images are supported",
            )

        # Upload image to Supabase Storage.
        file_path = f"complaints/{uuid.uuid4()}.{ext}"

        supabase.storage.from_("complaint-images").upload(
            file_path,
            file_data,
            {"content-type": final_content_type},
        )

        image_url = supabase.storage.from_(
            "complaint-images"
        ).get_public_url(file_path)

        # Run vision analysis and agent processing outside the async event loop.
        
        # Run vision analysis and agent processing outside the async event loop.
        def run_ai_pipeline():
            logger.info("STEP 1: Starting Ollama vision analysis")

            vision_result = analyze_image(file_data)

            logger.info(
                "STEP 2: Vision analysis completed: %s",
                vision_result,
            )

            logger.info("STEP 3: Starting agent processing")

            processed_result = process_complaint(vision_result)

            logger.info("STEP 4: Agent processing completed")

            return processed_result

        ai_analysis = await run_in_threadpool(run_ai_pipeline)


        # Resolve the AI-recommended department.
        department_name = ai_analysis.get(
            "category",
            "General Maintenance",
        )

        department_id = get_department_id(department_name)

        return {
            "message": "Image analyzed successfully",
            "image_url": image_url,
            "department_id": department_id,
            "ai_analysis": ai_analysis,
        }

    except HTTPException:
        raise

    except Exception:
        logger.exception("Failed to upload or analyze complaint image")

        raise HTTPException(
            status_code=500,
            detail="Failed to upload or analyze complaint image",
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
