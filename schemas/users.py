"""
schemas/users.py
Pydantic models for user profile operations.
"""
from pydantic import BaseModel
from typing import Optional


class UserUpdate(BaseModel):
    tpa_name: Optional[str] = None
    hospital_id: Optional[str] = None
