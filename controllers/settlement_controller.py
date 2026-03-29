import os
import sys
import json
from typing import List
from fastapi import UploadFile, HTTPException, status
from google import genai
from google.genai import types

import logging

# Disable most logging for cleaner output
logging.getLogger("google").setLevel(logging.ERROR)
logging.getLogger("httpx").setLevel(logging.ERROR)

# ---------------------------
# Robust Path Initialization
# ---------------------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

# Support legacy non-package neighbor imports
sys.path.append(os.path.join(BASE_DIR, "preprocessing"))

from core.supabase import get_supabase
from preprocessing.pdf_to_text import run_pdf_pipeline
from schemas.settlement import SettlementAuditResult
import dotenv

dotenv.load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")

class SettlementController:
    """
    Controller for auditing insurance settlement letters against FHIR clinical records.
    """
    
    async def audit_settlement(self, patient_id: str, file: UploadFile, tpa_id: str) -> dict:
        supabase = get_supabase()
        
        # 1. Update Patient Status to "discharged"
        print(f"Update patient {patient_id} status to 'discharge'...")
        try:
            supabase.table("patients").update({"step": "discharge"}).eq("id", patient_id).eq("tpa_id", tpa_id).execute()
        except Exception as e:
            print(f"Warning: Failed to update patient status: {e}")

        # 2. Extract text from Settlement PDF
        print(f"Extracting text from settlement letter: {file.filename}...")
        # Save temp file for OCR
        temp_dir = os.path.join(BASE_DIR, "temp")
        os.makedirs(temp_dir, exist_ok=True)
        temp_path = os.path.join(temp_dir, file.filename)
        
        await file.seek(0)
        with open(temp_path, "wb") as buffer:
            buffer.write(await file.read())
            
        try:
            settlement_text = run_pdf_pipeline(temp_path, file.filename)
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)

        # 3. Fetch Patient and FHIR Records for Context
        print(f"Fetching context for patient {patient_id}...")
        patient_res = supabase.table("patients").select("name").eq("id", patient_id).single().execute()
        patient_name = patient_res.data.get("name", "Unknown Patient")
        
        fhir_res = supabase.table("fhir_records").select("fhir_json").eq("patient_id", patient_id).execute()
        fhir_context = [record["fhir_json"] for record in fhir_res.data]
        
        if not fhir_context:
            print("Warning: No FHIR records found for this patient. Audit will be limited.")

        # 4. AI Audit Analysis
        print("Running AI Audit...")
        if not API_KEY:
            raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured.")
            
        client = genai.Client(api_key=API_KEY)
        
        prompt = f"""
        You are a Medical Billing Auditor. Compare the Settlement Letter against FHIR data.
        
        CONTEXT (FHIR CLINICAL DATA):
        {json.dumps(fhir_context, indent=2)}
        
        SETTLEMENT LETTER TEXT:
        {settlement_text}
        
        INSTRUCTIONS:
        1. Extract the Patient Name and {patient_id}.
        2. Set 'is_audit_passed' to true only if deductions are zero.
        3. If false, list EVERY deductions with:
           - The exact 'amount' deducted.
           - The 'reason_given' by insurance.
           - A 'recommendation' explaining EXACTLY which missing bills, test reports, or clinical notes (from FHIR or otherwise) are needed to recover this specific amount.
           - A 'pass_probability' (percentage 0-100%) representing the chance of winning an appeal if the recommended documents are provided.
        4. DO NOT include a summary paragraph.
        5. Return strictly in JSON format.
        """
        
        try:
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=SettlementAuditResult,
                    temperature=0.1 
                ),
            )
            
            audit_result = SettlementAuditResult.model_validate_json(response.text)
            return audit_result.model_dump()
            
        except Exception as e:
            print(f"Audit failure: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail=f"AI Audit failed: {str(e)}"
            )
        
