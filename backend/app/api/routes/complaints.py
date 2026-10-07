import uuid

from fastapi import APIRouter, UploadFile, File, HTTPException

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
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    try:
        file_data = await file.read()

        if not file_data:
            raise HTTPException(
                status_code=400,
                detail="Uploaded file is empty"
            )

        # Generate unique filename
        ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else ""
        unique_name = f"{uuid.uuid4()}.{ext}" if ext else str(uuid.uuid4())
        file_path = f"complaints/{unique_name}"

        # Upload image to Supabase Storage
        supabase.storage \
            .from_("complaint-images") \
            .upload(file_path, file_data)

        # Get public URL
        image_url = supabase.storage \
            .from_("complaint-images") \
            .get_public_url(file_path)

        # Analyze image using Qwen3-VL
        ai_analysis = analyze_image(file_data)

        return {
            "message": "Image uploaded and analyzed successfully",
            "image_url": image_url,
            "ai_analysis": ai_analysis
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )