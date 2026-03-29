"""
routers/patients.py
Full CRUD for the patients table, scoped to the current user's tpa_id.
"""
from fastapi import APIRouter, Depends, status
from schemas.patients import PatientCreate, PatientUpdate, PatientOut, PatientAmountItem
from controllers import patients_controller
from core.dependencies import get_current_user
from typing import List

router = APIRouter(prefix="/patients", tags=["Patients"])


@router.post("/", status_code=status.HTTP_201_CREATED, response_model=PatientOut)
async def create(body: PatientCreate, current_user=Depends(get_current_user)):
    return await patients_controller.create_patient(body.model_dump(), tpa_id=str(current_user.id))


@router.get("/", response_model=List[PatientOut])
async def list_all(current_user=Depends(get_current_user)):
    return await patients_controller.list_patients(tpa_id=str(current_user.id))


@router.get("/{patient_id}", response_model=PatientOut)
async def get_one(patient_id: str, current_user=Depends(get_current_user)):
    return await patients_controller.get_patient(patient_id, tpa_id=str(current_user.id))


@router.put("/{patient_id}", response_model=PatientOut)
async def update(patient_id: str, body: PatientUpdate, current_user=Depends(get_current_user)):
    return await patients_controller.update_patient(patient_id, tpa_id=str(current_user.id), data=body.model_dump())


@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete(patient_id: str, current_user=Depends(get_current_user)):
    await patients_controller.delete_patient(patient_id, tpa_id=str(current_user.id))


@router.patch("/{patient_id}/amount", response_model=PatientOut)
async def update_amount(patient_id: str, body: PatientAmountItem, current_user=Depends(get_current_user)):
    return await patients_controller.upsert_patient_amount(
        patient_id=patient_id, 
        tpa_id=str(current_user.id), 
        description=body.description, 
        amount=body.amount
    )


@router.delete("/{patient_id}/amount/{description}", response_model=PatientOut)
async def delete_amount(patient_id: str, description: str, current_user=Depends(get_current_user)):
    return await patients_controller.delete_patient_amount(
        patient_id=patient_id, 
        tpa_id=str(current_user.id), 
        description=description
    )
