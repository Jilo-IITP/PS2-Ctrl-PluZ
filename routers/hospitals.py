"""
routers/hospitals.py
Full CRUD for the hospitals table.
"""
from fastapi import APIRouter, Depends, status
from schemas.hospitals import HospitalCreate, HospitalUpdate, HospitalOut
from controllers import hospitals_controller
from core.dependencies import get_current_user
from typing import List

router = APIRouter(prefix="/hospitals", tags=["Hospitals"], dependencies=[Depends(get_current_user)])


@router.post("/", status_code=status.HTTP_201_CREATED, response_model=HospitalOut)
async def create(body: HospitalCreate):
    return await hospitals_controller.create_hospital(body.model_dump())


@router.get("/", response_model=List[HospitalOut])
async def list_all():
    return await hospitals_controller.list_hospitals()


@router.get("/{hospital_id}", response_model=HospitalOut)
async def get_one(hospital_id: str):
    return await hospitals_controller.get_hospital(hospital_id)


@router.put("/{hospital_id}", response_model=HospitalOut)
async def update(hospital_id: str, body: HospitalUpdate):
    return await hospitals_controller.update_hospital(hospital_id, body.model_dump())


@router.delete("/{hospital_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete(hospital_id: str):
    await hospitals_controller.delete_hospital(hospital_id)
