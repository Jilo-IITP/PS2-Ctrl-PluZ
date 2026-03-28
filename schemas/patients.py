"""
schemas/patients.py
Pydantic models for patient CRUD.
"""
from pydantic import BaseModel
from typing import Optional


class PatientCreate(BaseModel):
    name: str
    gender: Optional[str] = None
    contact: Optional[str] = None
    dob: Optional[str] = None          # ISO date string YYYY-MM-DD
    age: Optional[int] = None
    policy_number: Optional[str] = None
    employee_id: Optional[str] = None
    insurer_id: Optional[str] = None
    medical_claim: Optional[bool] = False
    occupation: Optional[str] = None
    address: Optional[str] = None


class PatientUpdate(BaseModel):
    name: Optional[str] = None
    gender: Optional[str] = None
    contact: Optional[str] = None
    dob: Optional[str] = None
    age: Optional[int] = None
    policy_number: Optional[str] = None
    employee_id: Optional[str] = None
    insurer_id: Optional[str] = None
    medical_claim: Optional[bool] = None
    occupation: Optional[str] = None
    address: Optional[str] = None


class PatientOut(BaseModel):
    id: str
    tpa_id: Optional[str] = None
    name: str
    gender: Optional[str] = None
    contact: Optional[str] = None
    dob: Optional[str] = None
    age: Optional[int] = None
    policy_number: Optional[str] = None
    employee_id: Optional[str] = None
    insurer_id: Optional[str] = None
    medical_claim: Optional[bool] = None
    occupation: Optional[str] = None
    address: Optional[str] = None
    created_at: Optional[str] = None
