"""
controllers/patients_controller.py
CRUD operations for the patients table.
All operations are scoped by the authenticated user's tpa_id (= user.id).
"""
from fastapi import HTTPException, status
from core.supabase import get_supabase


async def create_patient(data: dict, tpa_id: str) -> dict:
    supabase = get_supabase()
    # Sanitize data: convert empty strings to None
    sanitized_data = {k: (None if v == "" else v) for k, v in data.items()}
    
    # Check if we should perform an upsert based on aadhar_no
    aadhar_no = sanitized_data.get("aadhar_no")
    if aadhar_no:
        try:
            # Check if a patient with this aadhar_no already exists
            existing = supabase.table("patients").select("*").eq("aadhar_no", aadhar_no).execute()
            if existing.data:
                existing_patient = existing.data[0]
                patient_id = existing_patient["id"]
                
                # Update existing patient with new tpa_id and other provided data
                # Only update fields that are provided (not None) to avoid data loss
                update_data = {k: v for k, v in sanitized_data.items() if v is not None}
                update_data["tpa_id"] = tpa_id
                
                res = supabase.table("patients").update(update_data).eq("id", patient_id).execute()
                if res.data:
                    return res.data[0]
        except Exception as e:
            print(f"[WARN] controllers.patients_controller.create_patient (upsert check): {e}")

    row = {**sanitized_data, "tpa_id": tpa_id}
    # If name is still missing for a new patient, provide a default
    if not row.get("name"):
        if aadhar_no:
            row["name"] = f"Patient {aadhar_no}"
        else:
            row["name"] = "Unknown Patient"

    try:
        res = supabase.table("patients").insert(row).execute()
        if not res.data:
            raise ValueError(f"Insert successful but no row data returned from Supabase. Result: {res}")
        return res.data[0]
    except Exception as e:
        print(f"[ERROR] controllers.patients_controller.create_patient: {e}")
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
        if not res.data:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Patient not found")
        return res.data[0]
    except HTTPException:
        raise
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
        if not res.data:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Patient not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e))
