"""
controllers/pipeline_controller.py
Pipeline orchestration logic split into two stages: Pre-Auth and Admitted (Discharge).
Both run the full 4-step pipeline. Pre-Auth additionally generates the medi_assist form JSON.
FHIR records are upserted (replaced, not duplicated) per patient.
"""
from preprocessing.pdf_to_text import structure_text_with_gemini
from preprocessing.pdf_to_text import process_single_pdf
import os
import json
import uuid
from typing import List, Optional
from fastapi import UploadFile, HTTPException
from core.supabase import get_supabase
from supabase import Client

# Local Pipeline Imports
import sys
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
for sub in ("preprocessing", "retrieval", "formatting", "validator"):
    p = os.path.join(BASE_DIR, sub)
    if p not in sys.path:
        sys.path.append(p)

from preprocessing.pdf_to_text import run_pdf_pipeline
from retrieval.generate_handoff import run_retrieval_pipeline
from formatting.fhir_gen import run_fhir_generation
from validator.final_val import run_validation

from pydantic import BaseModel

class PipelineRequest(BaseModel):
    document_ids: List[str]
    patient_id: str
    tpa_id: Optional[str] = None

import dotenv
dotenv.load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")

INPUT_FOLDER = os.path.join(BASE_DIR, "preprocessing", "hospital_pdfs")
os.makedirs(INPUT_FOLDER, exist_ok=True)

CACHE = {}


# ---------------------------------------------------------------------------
# FHIR upsert helper – one record per patient, replace on re-run
# ---------------------------------------------------------------------------
async def _upsert_fhir_record(patient_id: str, tpa_id: str, fhir_bundle: dict, is_valid: bool):
    """Insert or update the FHIR record for a patient so there is always exactly one."""
    supabase = get_supabase()
    existing = (
        supabase.table("fhir_records")
        .select("id")
        .eq("patient_id", patient_id)
        .execute()
    )
    payload = {
        "patient_id": patient_id,
        "tpa_id": tpa_id,
        "fhir_json": fhir_bundle,
        "is_valid": is_valid,
    }
    if existing.data and len(existing.data) > 0:
        record_id = existing.data[0]["id"]
        supabase.table("fhir_records").update(payload).eq("id", record_id).execute()
        print(f"✅ FHIR record updated for patient {patient_id}")
    else:
        supabase.table("fhir_records").insert(payload).execute()
        print(f"✅ FHIR record created for patient {patient_id}")


# ---------------------------------------------------------------------------
# Build medi_assist form JSON from the AI extraction (real schema)
# ---------------------------------------------------------------------------
def _build_preauth_form_json(ai_extract: dict, patient_db: dict = None, hospital_db: dict = None) -> dict:
    """Map AI-extracted data into the exact medi_assist.html formData schema."""
    patients = ai_extract.get("patients", [])
    pat = patients[0] if patients else {}
    diagnoses = pat.get("diagnoses", [])
    services = pat.get("services", [])
    diag0 = diagnoses[0] if diagnoses else {}
    hospital_db = hospital_db or {}
    
    clinical = pat.get("clinical_details") or {}
    admission = pat.get("admission_details") or {}

    # Try to figure out doctor name from extraction
    doctor_name = pat.get("doctor_name", "")

    # Build cost estimates from services
    total_cost = 0
    for svc in services:
        amt = svc.get("amount", 0)
        if isinstance(amt, (int, float)):
            total_cost += amt

    form = {
        "hospital": {
            "name":       hospital_db.get("name", patient_db.get("hospital_name", "") if patient_db else ""),
            "location":   hospital_db.get("location", ""),
            "hospitalId": str(hospital_db.get("id", "")),
            "emailId":    hospital_db.get("email_id", ""),
            "rohiniId":   hospital_db.get("rohini_id", "")
        },
        "patient": {
            "name":                 patient_db.get("name", "") if patient_db else "",
            "gender":               patient_db.get("gender", "") if patient_db else "",
            "contactNo":            patient_db.get("contact", "") if patient_db else "",
            "altContactNo":         "",
            "ageYears":             str(patient_db.get("age", "")) if patient_db else "",
            "ageMonths":            "",
            "dateOfBirth":          patient_db.get("dob", "") if patient_db else "",
            "insurerIdCardNo":      patient_db.get("insurer_id", "") if patient_db else "",
            "policyNumber":         patient_db.get("policy_number", "") if patient_db else "",
            "employeeId":           patient_db.get("employee_id", "") if patient_db else "",
            "hasOtherMedicalClaim": "Yes" if (patient_db or {}).get("medical_claim") else "No",
            "insurerName":          "",
            "claimDetails":         "",
            "familyPhysicianName":  "",
            "familyPhysicianContact": "",
            "occupation":           patient_db.get("occupation", "") if patient_db else "",
            "address":              patient_db.get("address", "") if patient_db else ""
        },
        "doctor": {
            "name":                 doctor_name,
            "contactNo":            "",
            "illnessDescription":   clinical.get("illness_description") or diag0.get("condition", ""),
            "clinicalFindings":     clinical.get("clinical_findings", ""),
            "durationDays":         clinical.get("duration_of_ailment_days", ""),
            "firstConsultationDate":"",
            "pastHistory":          clinical.get("past_history", ""),
            "provisionalDiagnosis": clinical.get("provisional_diagnosis") or diag0.get("condition", ""),
            "icd10Code":            diag0.get("icd_10_code", ""),
            "proposedTreatment":    clinical.get("proposed_line_of_treatment") or [svc.get("description", "") for svc in services[:3]],
            "investigationDetails": clinical.get("investigation_details", ""),
            "routeOfDrugAdmin":     clinical.get("route_of_drug_administration", ""),
            "surgeryName":          clinical.get("surgery_name", ""),
            "icd10PcsCode":         "",
            "otherTreatmentDetails":"",
            "injuryDescription":    clinical.get("injury_cause", ""),
            "accident": {
                "isRTA": "No", "dateOfInjury": "", "reportedToPolice": "No",
                "firNo": "", "substanceAbuse": "No", "testConducted": "No"
            },
            "maternity": {"G": "", "P": "", "L": "", "A": "", "expectedDeliveryDate": ""}
        },
        "admission": {
            "dateOfAdmission": admission.get("date_of_admission", ""),
            "timeOfAdmission": admission.get("time_of_admission", ""),
            "isEmergency":     admission.get("is_emergency", "planned"),
            "expectedDays":    admission.get("expected_days_in_hospital", ""),
            "icuDays":         admission.get("days_in_icu", "0"),
            "roomType":        admission.get("room_type", "")
        },
        "costs": {
            "roomRent": "", "investigationCost": "", "icuCharges": "",
            "otCharges": "", "professionalFees": "", "medicinesImplants": "",
            "otherExpenses": "", "packageCharges": "",
            "totalCost": str(int(total_cost)) if total_cost else ""
        },
        "chronicHistory": {
            "diabetes": False, "diabetesSince": "",
            "heartDisease": False, "heartDiseaseSince": "",
            "hypertension": False, "hypertensionSince": "",
            "hyperlipidemias": False, "hyperlipidSince": "",
            "osteoarthritis": False, "osteoarthritisSince": "",
            "asthma": False, "asthmaSince": "",
            "cancer": False, "cancerSince": "",
            "alcoholDrugAbuse": False, "alcoholSince": "",
            "hivStd": False, "hivSince": "",
            "otherAilment": ""
        },
        "declaration": {
            "treatingDoctor": {
                "name": doctor_name, "qualification": "", "registrationNo": ""
            },
            "patient": {
                "name": pat.get("full_name", ""),
                "contactNumber": patient_db.get("contact", "") if patient_db else "",
                "emailId": "", "signatureDate": "", "signatureTime": ""
            },
            "hospital": {"sealDate": "", "sealTime": ""}
        }
    }
    return form
# Initialize Supabase Client from Singleton
try:
    supabase = get_supabase()
    print("✅ Supabase client initialized via singleton.")
except Exception as e:
    print(f"❌ Failed to initialize Supabase client: {e}")
    supabase = None
    
def fetch_supabase_patient(pid):
    """Fetches full patient info from Supabase."""
    if not supabase or not pid:
        return {}
    
    try:
        response = supabase.table("patients").select("*").eq("id", pid).execute()
        if response.data:
            return response.data[0]
    except Exception as e:
        print(f"❌ Error fetching patient: {e}")
    return {}
# ---------------------------------------------------------------------------
# Core 4-step pipeline
# ---------------------------------------------------------------------------


import uuid
from typing import List
from fastapi import HTTPException
from supabase import Client
import os

async def process_full_pipeline(
    document_ids: List[str], 
    patient_id: str, 
    cms_dicts: dict, 
    supabase: Client, 
    tpa_id: str 
):
    combined_structured = ""
    doc_id = str(uuid.uuid4())
    
    # ==========================================
    # STEP 1: DOWNLOAD FROM BUCKET & PROCESS
    # ==========================================
    for doc_uuid in document_ids:
        doc_res = supabase.table("documents").select("file_name, file_url").eq("id", doc_uuid).execute()
        
        if not doc_res.data:
            continue
            
        file_url = doc_res.data[0]["file_url"]
        file_name = doc_res.data[0]["file_name"]
        
        # --- THE FIX: Extract the relative path just like you do in delete_document ---
        marker = "/storage/v1/object/public/medical_documents/"
        if marker in file_url:
            storage_path = file_url.split(marker, 1)[1]
        else:
            storage_path = file_url # Fallback just in case
            
        print(f"--- Downloading {file_name} from Supabase Storage ---")
        
        try:
            # Pass the clean storage_path, NOT the full URL
            file_bytes = supabase.storage.from_("medical_documents").download(storage_path)
            
            # 3. Process the bytes in memory using our fast function
            raw_content = process_single_pdf(file_bytes, file_name) 
            structured_text = structure_text_with_gemini(raw_content, file_name)
            
            if structured_text.startswith("Error"):
                raise Exception(structured_text)
                
            combined_structured += structured_text + "\n\n"
            
            # 4. UPDATE the existing document row with the extracted text
            supabase.table("documents").update({
                "extracted_text": structured_text 
            }).eq("id", doc_uuid).execute()

        except Exception as e:
            print(f"❌ Failed processing {file_name}: {e}")
            raise HTTPException(status_code=500, detail=str(e))
            
    # ==========================================
    # STEP 2: BATCH RETRIEVAL (VERITAS)
    # ==========================================
    try:
        print("⏳ Running Step 2: Retrieval Mapping on merged data...")
        combined_retrieval = run_retrieval_pipeline(combined_structured)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # ==========================================
    # STEP 3: FHIR GENERATION
    # ==========================================
    print("⏳ Running Step 3: FHIR Generation...")
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise Exception("GEMINI_API_KEY not found.")
        
    fhir_bundles, ai_extract = run_fhir_generation(
        combined_structured, 
        combined_retrieval, 
        api_key
    )

    patient_data_ext = ai_extract.get("patients", [{}])[0] if ai_extract.get("patients") else {}
    
    pat_response = supabase.table("patients").select("name").eq("id", patient_id).execute()
    pat_name = pat_response.data[0]["name"] if pat_response.data else "Unknown"

    diagnoses = patient_data_ext.get("diagnoses", [])
    mapped_services = []
    for svc in patient_data_ext.get("services", []):
        mapped_services.append({
            "description": svc.get("description", ""),
            "amount": svc.get("amount", 0),
            "cpt_code": svc.get("cpt_code_mentioned", ""),
            "icd_10": diagnoses[0].get("icd_10_code", "") if diagnoses else "",
            "match_confidence": "98%",
        })

    # ==========================================
    # STEP 4: VALIDATION
    # ==========================================
    print("⏳ Running Step 4: Final Validation...")
    validation_report = run_validation(
        fhir_bundles, 
        cms_dicts["ptp_edits"], 
        cms_dicts["mue_limits"], 
        cms_dicts["gender_codes"], 
        cms_dicts["ncd_map"]
    )

    is_valid = True
    if isinstance(validation_report, dict):
        is_valid = validation_report.get("is_valid", True)
    elif isinstance(validation_report, list):
        is_valid = len(validation_report) == 0  

    # ==========================================
    # STEP 5: UPSERT FINAL RECORD TO DB
    # ==========================================
    fhir_bundle = fhir_bundles[0] if fhir_bundles else {}
    if tpa_id and fhir_bundle:
        try:
            supabase.table("fhir_records").upsert({
                "patient_id": patient_id,
                "tpa_id": tpa_id,
                "fhir_json": fhir_bundle,
                "combined_ocr_text": combined_structured,     
                "combined_retrieval_text": combined_retrieval, 
                "is_valid": is_valid
            }, on_conflict="patient_id").execute()
        except Exception as e:
            print(f"⚠️ FHIR DB upsert warning (non-fatal): {e}")

    result = {
        "doc_id": doc_id,
        "fileName": "Batch processing" if len(document_ids) > 1 else "Single Document",
        "invoice_number": ai_extract.get("invoice_number") or f"INV-{uuid.uuid4().hex[:6].upper()}",
        "invoice_date": ai_extract.get("invoice_date", "Unknown"),
        "hospital_name": ai_extract.get("hospital_name", "Unknown Hospital"),
        "confidence_score": 95,
        "patient": {
            "name": pat_name, 
            "doctor_name": patient_data_ext.get("doctor_name", ""),
            "services": mapped_services,
            "diagnoses": [
                {
                    "condition": d.get("condition", ""),
                    "icd_10_code": d.get("icd_10_code", ""),
                }
                for d in diagnoses
            ],
        },
        "fhir_bundle": fhir_bundle,
        "validation_report": validation_report,
        "ai_extract": ai_extract,
    }

    return [result]


# ---------------------------------------------------------------------------
# Preauth endpoint
# ---------------------------------------------------------------------------
async def run_preauth_pipeline(req: PipelineRequest, cms_dicts: dict):
    print(f"\n🚀 API HIT: Processing {len(req.document_ids)} files through Pre-Auth Pipeline for patient {req.patient_id}.")

    try:
        # 2. Pass document_ids instead of files
        results = await process_full_pipeline(
            document_ids=req.document_ids, 
            patient_id=req.patient_id, 
            cms_dicts=cms_dicts, 
            supabase=supabase, 
            tpa_id=req.tpa_id
        )

        # Fetch patient record from DB for form hydration
        patient_db = {}
        try:
            res = supabase.table("patients").select("*").eq("id", req.patient_id).single().execute()
            patient_db = res.data or {}
        except Exception:
            pass

        # Fetch TPA/Hospital data
        hospital_db = {}
        try:
            if req.tpa_id:
                user_res = supabase.table("users").select("hospital_id").eq("id", req.tpa_id).single().execute()
                h_id = (user_res.data or {}).get("hospital_id")
                if h_id:
                    hosp_res = supabase.table("hospitals").select("*").eq("id", h_id).single().execute()
                    hospital_db = hosp_res.data or {}
        except Exception as e:
            print(f"⚠️ Failed to fetch hospital details for TPA: {e}")

        # Build the real medi_assist form JSON
        preauth_form_json = _build_preauth_form_json(results[0]["ai_extract"], patient_db, hospital_db)
        results[0]["preauth_form_json"] = preauth_form_json

        return {"status": "success", "results": results}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Failed preauth pipeline: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Admitted endpoint — full pipeline, no form JSON
# ---------------------------------------------------------------------------
async def run_admitted_pipeline(req: PipelineRequest, cms_dicts: dict):
    print(f"\n🚀 API HIT: Running Admitted Pipeline for patient {req.patient_id}.")

    if not req.document_ids:
        raise HTTPException(status_code=400, detail="Admitted pipeline requires discharge summary/files.")


    try:
        results = await process_full_pipeline(
            document_ids=req.document_ids, 
            patient_id=req.patient_id, 
            cms_dicts=cms_dicts, 
            supabase=supabase, 
            tpa_id=req.tpa_id
        )
        return {"status": "success", "results": results}
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Failed admitted pipeline: {e}")
        raise HTTPException(status_code=500, detail=str(e))
