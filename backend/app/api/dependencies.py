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

        user_data = None
        if not response.data:
            meta = auth_user.user_metadata or {}
            role = meta.get("role", "student")
            name = meta.get("name") or (auth_user.email.split("@")[0] if auth_user.email else "Student")
            inserted = (
                supabase.table("users")
                .insert({
                    "auth_user_id": str(auth_user.id),
                    "name": name,
                    "email": auth_user.email,
                    "role": role,
                })
                .execute()
            )
            if inserted.data:
                user_data = inserted.data[0]
            else:
                raise HTTPException(
                    status_code=403,
                    detail="No user profile is linked to this account",
                )
        else:
            user_data = response.data[0]

        meta = auth_user.user_metadata or {}
        user_dict = dict(user_data)
        user_dict["roll_number"] = meta.get("roll_number")
        user_dict["department"] = meta.get("department")
        user_dict["hostel_block"] = meta.get("hostel_block")
        user_dict["room_number"] = meta.get("room_number")

        return user_dict

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
