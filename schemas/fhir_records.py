"""
schemas/fhir_records.py
Pydantic models for FHIR record CRUD.
"""
from pydantic import BaseModel
from typing import Optional, Any


class FHIRCreate(BaseModel):
    patient_id: str
    fhir_json: Any             # Arbitrary FHIR JSON bundle
    is_valid: Optional[bool] = False


class FHIRUpdate(BaseModel):
    fhir_json: Optional[Any] = None
    is_valid: Optional[bool] = None


class FHIROut(BaseModel):
    id: str
    patient_id: Optional[str] = None
    tpa_id: Optional[str] = None
    fhir_json: Optional[Any] = None
    is_valid: Optional[bool] = None
    created_at: Optional[str] = None
