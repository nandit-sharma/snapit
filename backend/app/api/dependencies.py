from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.database.database import supabase

security = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict:
    if credentials is None:
        raise HTTPException(
            status_code=401,
            detail="Authentication token required",
        )

    try:
        auth_response = supabase.auth.get_user(
            credentials.credentials
        )
        auth_user = auth_response.user

        if auth_user is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication token",
            )

        response = (
            supabase.table("users")
            .select("id, auth_user_id, name, email, role")
            .eq("auth_user_id", str(auth_user.id))
            .limit(1)
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=403,
                detail="No user profile is linked to this account",
            )

        return response.data[0]

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token",
        )


def require_roles(*allowed_roles: str):
    def role_checker(
        current_user: dict = Depends(get_current_user),
    ) -> dict:
        if current_user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to perform this action",
            )

        return current_user

    return role_checker