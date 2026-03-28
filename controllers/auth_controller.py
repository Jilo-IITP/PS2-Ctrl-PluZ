"""
controllers/auth_controller.py
Business logic for authentication: register, login, logout, get_profile.
Register creates both a Supabase auth user AND a row in the public.users table.
"""
from fastapi import HTTPException, status
from core.supabase import get_supabase


async def register_user(email: str, password: str, tpa_name: str, hospital_id: str | None):
    """
    1. Create Supabase auth user (email_confirm=True to skip verification).
    2. Insert a matching row into public.users with id = auth user id.
    """
    supabase = get_supabase()

    # Step 1 — create auth user
    try:
        auth_result = supabase.auth.admin.create_user(
            {
                "email": email,
                "password": password,
                "email_confirm": True,
            }
        )
    except Exception as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=f"Auth user creation failed: {e}")

    auth_user = auth_result.user
    if auth_user is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Auth user creation returned no user")

    # Step 2 — insert into public.users table (id mirrors auth.users.id)
    user_row = {
        "id": str(auth_user.id),
        "tpa_name": tpa_name,
    }
    if hospital_id:
        user_row["hospital_id"] = hospital_id

    try:
        supabase.table("users").insert(user_row).execute()
    except Exception as e:
        # Rollback: delete the auth user if DB insert fails
        try:
            supabase.auth.admin.delete_user(str(auth_user.id))
        except Exception:
            pass
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=f"User profile creation failed: {e}")

    return {
        "id": str(auth_user.id),
        "email": auth_user.email,
        "tpa_name": tpa_name,
        "hospital_id": hospital_id,
        "created_at": str(auth_user.created_at) if auth_user.created_at else None,
    }


async def login_user(email: str, password: str):
    """Sign in with email + password. Returns tokens + user profile from users table."""
    supabase = get_supabase()

    try:
        result = supabase.auth.sign_in_with_password(
            {"email": email, "password": password}
        )
    except Exception as e:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail=str(e))

    session = result.session
    auth_user = result.user

    if session is None or auth_user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Authentication failed")

    # Fetch profile from users table
    profile = _fetch_profile(str(auth_user.id))

    return {
        "access_token": session.access_token,
        "refresh_token": session.refresh_token,
        "token_type": "bearer",
        "user": {
            "id": str(auth_user.id),
            "email": auth_user.email,
            "tpa_name": profile.get("tpa_name"),
            "hospital_id": profile.get("hospital_id"),
            "created_at": profile.get("created_at"),
        },
    }


async def logout_user(user_id: str):
    """Server-side session revocation."""
    supabase = get_supabase()
    try:
        supabase.auth.admin.sign_out(user_id)
    except Exception as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e))


async def get_profile(user_id: str, email: str | None = None):
    """Fetch user profile from the public.users table."""
    profile = _fetch_profile(user_id)
    return {
        "id": user_id,
        "email": email,
        "tpa_name": profile.get("tpa_name"),
        "hospital_id": profile.get("hospital_id"),
        "created_at": profile.get("created_at"),
    }


def _fetch_profile(user_id: str) -> dict:
    """Internal helper: fetch single row from users table."""
    supabase = get_supabase()
    try:
        res = supabase.table("users").select("*").eq("id", user_id).single().execute()
        return res.data or {}
    except Exception:
        return {}
