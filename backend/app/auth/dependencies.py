from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.database.database import supabase

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    token = credentials.credentials

    try:
        response = supabase.auth.get_user(token)
        auth_user = response.user

        if not auth_user:
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication token",
            )

        profile_response = (
            supabase.table("users")
            .select("id, name, email, role")
            .eq("auth_user_id", str(auth_user.id))
            .limit(1)
            .execute()
        )

        if not profile_response.data:
            raise HTTPException(
                status_code=403,
                detail="User profile not found",
            )

        return profile_response.data[0]

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token",
        )