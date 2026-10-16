from app.agent.agent import process_complaint

import uuid

from fastapi import APIRouter, UploadFile, File, Form, HTTPException

from app.database.database import supabase
from app.ai.vision import analyze_image

router = APIRouter(prefix="/complaints", tags=["Complaints"])


@router.post("/")
def create_complaint(complaint: dict):
    try:
        response = supabase.table("complaints").insert(complaint).execute()

        return {
            "message": "Complaint created successfully",
            "complaint": response.data
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload")
async def upload_image(
    file: UploadFile = File(...),
    user_id: str = Form(...),
    location_id: str | None = Form(None)
):
    file_path = None

    try:
        # 1. Read and validate the image
        file_data = await file.read()

        if not file_data:
            raise HTTPException(
                status_code=400,
                detail="Uploaded file is empty"
            )

        if file.content_type not in ("image/jpeg", "image/png", "image/webp"):
            raise HTTPException(
                status_code=400,
                detail="Only JPEG, PNG and WebP images are supported"
            )

        # 2. Upload image to Supabase Storage
        ext = {
            "image/jpeg": "jpg",
            "image/png": "png",
            "image/webp": "webp"
        }[file.content_type]

        file_path = f"complaints/{uuid.uuid4()}.{ext}"

        supabase.storage.from_("complaint-images").upload(
            file_path,
            file_data,
            {"content-type": file.content_type}
        )

        image_url = supabase.storage.from_(
            "complaint-images"
        ).get_public_url(file_path)

        # 3. Analyze image using Qwen3-VL
        ai_analysis = analyze_image(file_data)
        ai_analysis = process_complaint(ai_analysis)

        # 4. Find the matching department
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
                    detail="General Maintenance department not found"
                )

            department_id = fallback.data[0]["id"]

        # 5. Build the database record
        complaint_data = {
            "user_id": user_id,
            "department_id": department_id,
            "image_url": image_url,
            "issue_type": ai_analysis.get("issue", "Campus issue"),
            "description": ai_analysis.get("description", ""),
            "severity": str(
                ai_analysis.get("severity", "medium")
            ).lower(),
            "status": "submitted",
            "ai_analysis": ai_analysis
        }

        if location_id:
            complaint_data["location_id"] = location_id

        # 6. Save complaint in Supabase
        saved = (
            supabase.table("complaints")
            .insert(complaint_data)
            .execute()
        )

        if not saved.data:
            raise HTTPException(
                status_code=500,
                detail="Complaint was not saved"
            )

        return {
            "message": "Complaint submitted successfully",
            "complaint": saved.data[0]
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
