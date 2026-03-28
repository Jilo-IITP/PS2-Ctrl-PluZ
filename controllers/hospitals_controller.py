"""
controllers/hospitals_controller.py
CRUD operations for the hospitals table.
"""
from fastapi import HTTPException, status
from core.supabase import get_supabase


async def create_hospital(data: dict) -> dict:
    supabase = get_supabase()
    try:
        res = supabase.table("hospitals").insert(data).execute()
        return res.data[0]
    except Exception as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e))


async def list_hospitals() -> list:
    supabase = get_supabase()
    res = supabase.table("hospitals").select("*").order("created_at", desc=True).execute()
    return res.data or []


async def get_hospital(hospital_id: str) -> dict:
    supabase = get_supabase()
    try:
        res = supabase.table("hospitals").select("*").eq("id", hospital_id).single().execute()
        return res.data
    except Exception:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Hospital not found")


async def update_hospital(hospital_id: str, data: dict) -> dict:
    supabase = get_supabase()
    # Strip None values so we only update provided fields
    update_data = {k: v for k, v in data.items() if v is not None}
    if not update_data:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="No fields to update")

    try:
        res = supabase.table("hospitals").update(update_data).eq("id", hospital_id).execute()
        if not res.data:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Hospital not found")
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e))


async def delete_hospital(hospital_id: str):
    supabase = get_supabase()
    try:
        res = supabase.table("hospitals").delete().eq("id", hospital_id).execute()
        if not res.data:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Hospital not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e))
