import sys
import os
from fastapi import APIRouter, UploadFile, File, HTTPException, Request
from typing import List
from controllers.pipeline_controller import PipelineController

# ---------------------------
# Robust Path Initialization
# ---------------------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

# ---------------------------
# Controller Instance
# ---------------------------
# Note: In a larger app, you'd use dependency injection (Depends) 
# but for this script-to-webapp migration, a singleton instance is consistent.
controller = PipelineController()

router = APIRouter(prefix="/pipeline", tags=["Pipeline Processing"])

@router.post("/process-pdfs")
async def process_medical_batch(request: Request, pdf_files: List[UploadFile] = File(...)):
    """
    Triggers the 4-stage pipeline: PDF Preprocessing, NER Retrieval, 
    FHIR Generation, and CMS Validation.
    """
    # Access CMS_DICTS from app state (initialized in api.py lifespan)
    cms_dicts = getattr(request.app.state, "cms_dicts", {})
    return await controller.process_medical_batch(pdf_files, cms_dicts)

@router.get("/fhir-result/{doc_id}")
async def get_fhir_result(doc_id: str):
    """Retrieves cached FHIR bundles for a processed document."""
    res = controller.get_fhir_result(doc_id)
    if not res:
        raise HTTPException(status_code=404, detail="Document ID not found in cache.")
    return res

@router.get("/validation-report/{doc_id}")
async def get_validation_report(doc_id: str):
    """Retrieves cached validation results for a processed document."""
    res = controller.get_validation_report(doc_id)
    if not res:
        raise HTTPException(status_code=404, detail="Document ID not found in cache.")
    return res
