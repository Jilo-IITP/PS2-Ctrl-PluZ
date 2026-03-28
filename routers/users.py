"""
routers/users.py
User profile routes: get own profile, update own profile.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from schemas.auth import UserOut
from schemas.users import UserUpdate
from core.dependencies import get_current_user
from core.supabase import get_supabase

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserOut)
async def get_my_profile(current_user=Depends(get_current_user)):
    supabase = get_supabase()
    try:
        res = supabase.table("users").select("*").eq("id", str(current_user.id)).single().execute()
        profile = res.data
    except Exception:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="User profile not found")

    return UserOut(
        id=str(current_user.id),
        email=current_user.email,
        tpa_name=profile.get("tpa_name"),
        hospital_id=profile.get("hospital_id"),
        created_at=profile.get("created_at"),
    )


@router.put("/me", response_model=UserOut)
async def update_my_profile(body: UserUpdate, current_user=Depends(get_current_user)):
    supabase = get_supabase()
    update_data = {k: v for k, v in body.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="No fields to update")

    try:
        res = supabase.table("users").update(update_data).eq("id", str(current_user.id)).execute()
        if not res.data:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="User profile not found")
        profile = res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e))

    return UserOut(
        id=str(current_user.id),
        email=current_user.email,
        tpa_name=profile.get("tpa_name"),
        hospital_id=profile.get("hospital_id"),
        created_at=profile.get("created_at"),
    )
