"""
controllers/fhir_controller.py
CRUD operations for the fhir_records table.
All operations scoped by tpa_id (= authenticated user's id).
"""
from fastapi import HTTPException, status
from core.supabase import get_supabase


async def create_fhir_record(data: dict, tpa_id: str) -> dict:
    supabase = get_supabase()
    row = {**data, "tpa_id": tpa_id}
    try:
        res = supabase.table("fhir_records").insert(row).execute()
        return res.data[0]
    except Exception as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e))


async def list_fhir_records(
    tpa_id: str,
    patient_id: str | None = None,
) -> list:
    supabase = get_supabase()
    query = supabase.table("fhir_records").select("*").eq("tpa_id", tpa_id)
    if patient_id:
        query = query.eq("patient_id", patient_id)
    res = query.order("created_at", desc=True).execute()
    return res.data or []


async def get_fhir_record(record_id: str, tpa_id: str) -> dict:
    supabase = get_supabase()
    try:
        res = (
            supabase.table("fhir_records")
            .select("*")
            .eq("id", record_id)
            .eq("tpa_id", tpa_id)
            .single()
            .execute()
        )
        return res.data
    except Exception:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="FHIR record not found")


async def update_fhir_record(record_id: str, tpa_id: str, data: dict) -> dict:
    supabase = get_supabase()
    update_data = {k: v for k, v in data.items() if v is not None}
    if not update_data:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="No fields to update")

    try:
        res = (
            supabase.table("fhir_records")
            .update(update_data)
            .eq("id", record_id)
            .eq("tpa_id", tpa_id)
            .execute()
        )
        if not res.data:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="FHIR record not found")
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e))


async def delete_fhir_record(record_id: str, tpa_id: str):
    supabase = get_supabase()
    try:
        res = (
            supabase.table("fhir_records")
            .delete()
            .eq("id", record_id)
            .eq("tpa_id", tpa_id)
            .execute()
        )
        if not res.data:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="FHIR record not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e))
