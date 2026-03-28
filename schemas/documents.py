"""
schemas/documents.py
Pydantic models for document CRUD (Supabase Storage + DB).
"""
from pydantic import BaseModel
from typing import Optional


class DocumentOut(BaseModel):
    id: str
    patient_id: Optional[str] = None
    file_name: Optional[str] = None
    file_url: Optional[str] = None
    file_type: Optional[str] = None
    extracted_text: Optional[str] = None
    created_at: Optional[str] = None
