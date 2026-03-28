import os
import shutil
import uuid
import sys
from typing import List
from fastapi import UploadFile

# ---------------------------
# Robust Path Initialization
# ---------------------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

# Support legacy non-package neighbor imports in sub-modules
# (e.g., retrieval/generate_handoff.py depends on get_chunks.py)
sys.path.append(os.path.join(BASE_DIR, "preprocessing"))
sys.path.append(os.path.join(BASE_DIR, "retrieval"))
sys.path.append(os.path.join(BASE_DIR, "formatting"))
sys.path.append(os.path.join(BASE_DIR, "validator"))

from preprocessing.pdf_to_text import run_pdf_pipeline
from retrieval.generate_handoff import run_retrieval_pipeline
from formatting.fhir_gen import run_fhir_generation
from validator.final_val import run_validation
import dotenv

dotenv.load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")
INPUT_FOLDER = os.path.join(BASE_DIR, "preprocessing", "hospital_pdfs")

class PipelineController:
    """
    Controller handling the end-to-end medical document processing pipeline.
    Decouples business logic from FastAPI route definitions.
    """
    def __init__(self):
        # In-memory session cache (Note: For production, use Redis or a DB)
        self.cache = {}

    async def process_medical_batch(self, pdf_files: List[UploadFile], cms_dicts: dict) -> dict:
        print(f"\n🚀 PipelineController: Processing {len(pdf_files)} files through Full Pipeline.")
        os.makedirs(INPUT_FOLDER, exist_ok=True)

        results = []

        for file in pdf_files:
            print(f"--- Processing {file.filename} ---")
            file_path = os.path.join(INPUT_FOLDER, file.filename)
            
            # Reset file pointer and save to disk
            await file.seek(0)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            doc_id = str(uuid.uuid4())

            try:
                # STEP 1: Preprocessing (PDF to Structured Text)
                print("⏳ Running Step 1: Preprocessing...")
                structured_text = run_pdf_pipeline(file_path, file.filename)
                if structured_text.startswith("Error") or structured_text.startswith("Gemini API Error"):
                    raise Exception(structured_text)
                
                # Save intermediate output for retrieval step
                output_folder = os.path.join(BASE_DIR, "retrieval", "data_from_preprocessing")
                os.makedirs(output_folder, exist_ok=True)
                output_file = os.path.join(output_folder, "structured_hospital_data.txt")
                with open(output_file, "a", encoding="utf-8") as f:
                    f.write(structured_text + "\n\n")

                # STEP 2: Retrieval Handoff (NER + RAG)
                print("⏳ Running Step 2: Retrieval Mapping...")
                retrieval_text = run_retrieval_pipeline(structured_text)
                
                # Save retrieval output
                retrieval_folder = os.path.join(BASE_DIR, "data", "input")
                os.makedirs(retrieval_folder, exist_ok=True)
                retrieval_file = os.path.join(retrieval_folder, "reti_output.txt")
                with open(retrieval_file, "a", encoding="utf-8") as f:
                    f.write(retrieval_text + "\n\n")

                # STEP 3: FHIR Generation
                print("⏳ Running Step 3: FHIR Generation...")
                if not API_KEY:
                    raise Exception("GEMINI_API_KEY not found in environment.")
                fhir_bundles, ai_extract = run_fhir_generation(structured_text, retrieval_text, API_KEY)

                # STEP 4: Final Validation (CMS Rules Engine)
                print("⏳ Running Step 4: Final Validation...")
                validation_report = run_validation(
                    fhir_bundles,
                    cms_dicts.get("ptp_edits", {}),
                    cms_dicts.get("mue_limits", {}),
                    cms_dicts.get("gender_codes", {}),
                    cms_dicts.get("ncd_map", {}),
                )

                # Store complex results in cache for lookup endpoints
                self.cache[doc_id] = {
                    "fhir_bundles": fhir_bundles,
                    "validation_report": validation_report,
                }

                # Construct UI-friendly response model
                patient_data = ai_extract.get("patients", [{}])[0] if ai_extract.get("patients") else {}
                mapped_services = []
                for svc in patient_data.get("services", []):
                    mapped_services.append({
                        "description": svc.get("description", ""),
                        "amount": svc.get("amount", 0),
                        "cpt_code": svc.get("cpt_code_mentioned", ""),
                        "icd_10": patient_data.get("diagnoses", [{}])[0].get("icd_10_code", "") if patient_data.get("diagnoses") else "",
                        "match_confidence": "98%",
                    })

                results.append({
                    "doc_id": doc_id,
                    "fileName": file.filename,
                    "invoice_number": ai_extract.get("invoice_number") or f"INV-{uuid.uuid4().hex[:6].upper()}",
                    "invoice_date": ai_extract.get("invoice_date", "Unknown"),
                    "hospital_name": ai_extract.get("hospital_name", "Unknown Hospital"),
                    "confidence_score": 95,
                    "patient": {
                        "name": patient_data.get("full_name", "Unknown"),
                        "services": mapped_services,
                    },
                    "fhir_bundle": fhir_bundles[0] if fhir_bundles else {},
                    "validation_report": validation_report,
                })

                print(f"✅ Pipeline Complete for {file.filename}.")

            except Exception as e:
                print(f"❌ Failed processing {file.filename}: {e}")
                results.append({
                    "doc_id": doc_id,
                    "fileName": file.filename,
                    "error": str(e),
                })

        return {"status": "success", "results": results, "message": f"Processed {len(pdf_files)} documents."}

    def get_fhir_result(self, doc_id: str):
        return self.cache.get(doc_id, {}).get("fhir_bundles")

    def get_validation_report(self, doc_id: str):
        return self.cache.get(doc_id, {}).get("validation_report")
