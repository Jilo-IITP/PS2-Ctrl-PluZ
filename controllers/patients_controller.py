"""
controllers/patients_controller.py
CRUD operations for the patients table.
All operations are scoped by the authenticated user's tpa_id (= user.id).
"""
from fastapi import HTTPException, status
from core.supabase import get_supabase


async def create_patient(data: dict, tpa_id: str) -> dict:
    supabase = get_supabase()
    # Sanitize data: convert empty strings to None for optional fields 
    # (prevents 'invalid input syntax for type date: ""' errors)
    sanitized_data = {k: (None if v == "" else v) for k, v in data.items()}
    row = {**sanitized_data, "tpa_id": tpa_id}
    try:
        res = supabase.table("patients").insert(row).execute()
        if not res.data:
            # For some reason no data was returned, let's treat it as a successful but empty return 
            # OR better, throw an error to see why it didn't return (usually PostgREST behavior)
            raise ValueError(f"Insert successful but no row data returned from Supabase. Result: {res}")
        return res.data[0]
    except Exception as e:
        print(f"[ERROR] controllers.patients_controller.create_patient: {e}")
        # Return the actual error detail to the frontend for debugging
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e))


async def list_patients(tpa_id: str) -> list:
    supabase = get_supabase()
    res = (
        supabase.table("patients")
        .select("*")
        .eq("tpa_id", tpa_id)
        .order("created_at", desc=True)
        .execute()
    )
    return res.data or []


async def get_patient(patient_id: str, tpa_id: str) -> dict:
    supabase = get_supabase()
    try:
        res = (
            supabase.table("patients")
            .select("*")
            .eq("id", patient_id)
            .eq("tpa_id", tpa_id)
            .single()
            .execute()
        )
        return res.data
    except Exception:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Patient not found")


async def update_patient(patient_id: str, tpa_id: str, data: dict) -> dict:
    supabase = get_supabase()
    # Sanitize data: convert empty strings to None
    sanitized_data = {k: (None if v == "" else v) for k, v in data.items() if v is not None}
    if not sanitized_data:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="No fields to update")

    try:
        res = (
            supabase.table("patients")
            .update(sanitized_data)
            .eq("id", patient_id)
            .eq("tpa_id", tpa_id)
            .execute()
        )
        # Refetch the updated row since default update doesn't always return the payload
        updated_res = supabase.table("patients").select("*").eq("id", patient_id).single().execute()
        return updated_res.data
    except Exception as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e))


async def delete_patient(patient_id: str, tpa_id: str):
    supabase = get_supabase()
    try:
        res = (
            supabase.table("patients")
            .delete()
            .eq("id", patient_id)
            .eq("tpa_id", tpa_id)
            .execute()
        )
    except Exception as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e))
