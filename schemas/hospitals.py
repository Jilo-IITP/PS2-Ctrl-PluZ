"""
schemas/hospitals.py
Pydantic models for hospital CRUD.
"""
from pydantic import BaseModel
from typing import Optional


class HospitalCreate(BaseModel):
    name: str
    location: str
    email_id: Optional[str] = None
    rohini_id: Optional[str] = None
    


class HospitalUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    email_id: Optional[str] = None
    rohini_id: Optional[str] = None
    


class HospitalOut(BaseModel):
    id: str
    name: str
    location: Optional[str] = None
    email_id: Optional[str] = None
    rohini_id: Optional[str] = None
    
    created_at: Optional[str] = None
