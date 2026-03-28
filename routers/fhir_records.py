"""
routers/fhir_records.py
Full CRUD for FHIR records, scoped to the current user's tpa_id.
"""
from fastapi import APIRouter, Depends, Query, status
from schemas.fhir_records import FHIRCreate, FHIRUpdate, FHIROut
from controllers import fhir_controller
from core.dependencies import get_current_user
from typing import List, Optional

router = APIRouter(prefix="/fhir-records", tags=["FHIR Records"])


@router.post("/", status_code=status.HTTP_201_CREATED, response_model=FHIROut)
async def create(body: FHIRCreate, current_user=Depends(get_current_user)):
    return await fhir_controller.create_fhir_record(body.model_dump(), tpa_id=str(current_user.id))


@router.get("/", response_model=List[FHIROut])
async def list_all(
    patient_id: Optional[str] = Query(None),
    current_user=Depends(get_current_user),
):
    return await fhir_controller.list_fhir_records(tpa_id=str(current_user.id), patient_id=patient_id)


@router.get("/{record_id}", response_model=FHIROut)
async def get_one(record_id: str, current_user=Depends(get_current_user)):
    return await fhir_controller.get_fhir_record(record_id, tpa_id=str(current_user.id))


@router.put("/{record_id}", response_model=FHIROut)
async def update(record_id: str, body: FHIRUpdate, current_user=Depends(get_current_user)):
    return await fhir_controller.update_fhir_record(record_id, tpa_id=str(current_user.id), data=body.model_dump())


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete(record_id: str, current_user=Depends(get_current_user)):
    await fhir_controller.delete_fhir_record(record_id, tpa_id=str(current_user.id))
