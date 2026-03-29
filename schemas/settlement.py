from pydantic import BaseModel, Field
from typing import List, Optional

class DeductionDetail(BaseModel):
    amount: float = Field(
        ..., 
        description="The exact numerical value of the money deducted for this specific line item."
    )
    reason_given: Optional[str] = Field(
        None, 
        description="The justification or 'reason code' provided by the insurance company in the settlement letter."
    )
    recommendation: str = Field(
        ..., 
        description="A specific action plan. Identify which clinical documents, bills, or FHIR records are needed to prove this service was valid."
    )
    pass_probability: str = Field(
        ..., 
        description="An estimated percentage (e.g., '85%') of success if the recommended documents are provided during an appeal."
    )

class SettlementAuditResult(BaseModel):
    patient_id: str = Field(
        ..., 
        description="The unique UUID or identifier of the patient from the database."
    )
    patient_name: str = Field(
        ..., 
        description="The full name of the patient as identified in the hospital records."
    )
    is_audit_passed: bool = Field(
        ..., 
        description="Set to True only if zero deductions were made. Set to False if any amount was deducted."
    )
    total_deduction_amount: float = Field(
        ..., 
        description="The sum of all deductions found in the letter."
    )
    deductions: List[DeductionDetail] = Field(
        default_factory=list,
        description="A detailed list of every individual deduction found, mapping the reason to a clinical fix."
    )