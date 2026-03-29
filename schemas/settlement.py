from pydantic import BaseModel, Field
from typing import List, Optional

class Deduction(BaseModel):
    description: str = Field(description="Description of the deduction item.")
    amount: float = Field(description="The amount deducted.")
    reason_given: Optional[str] = Field(description="The reason for deduction as stated in the document.")
    is_valid: bool = Field(description="True if the deduction is clinically or administratively justified by the patient's record.")
    justification: str = Field(description="Explanation of why the deduction is valid or invalid based on FHIR context.")
    recommendation: Optional[str] = Field(description="Action to take if the deduction is invalid (e.g., appeal, dispute).")

class SettlementAuditResult(BaseModel):
    patient_id: str
    patient_name: str
    total_deductions: float
    deductions_list: List[Deduction]
    is_audit_passed: bool = Field(description="True if all deductions were valid or if no deductions were found.")
    summary: str = Field(description="Prose summary of the settlement audit findings.")
