from fastapi import APIRouter, Depends, UploadFile, File, Query, status, Request
from schemas.settlement import SettlementAuditResult
from controllers.settlement_controller import SettlementController
from core.dependencies import get_current_user
from typing import List

router = APIRouter(prefix="/settlement", tags=["Settlement Audit"], dependencies=[Depends(get_current_user)])

# Controller Instance
controller = SettlementController()

@router.post("/audit", status_code=status.HTTP_200_OK, response_model=dict)
async def audit_settlement(
    request: Request,
    patient_id: str = Query(...), 
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Audits an insurance settlement letter against FHIR clinical records.
    Automatically updates the patient's 'step' to 'discharged'.
    """
    tpa_id = current_user.get("id")
    return await controller.audit_settlement(patient_id, file, tpa_id)
