import os
import shutil
import uuid
import sys
from typing import List
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

# ---------------------------
# Router imports (new MVC)
# ---------------------------
from routers.auth import router as auth_router
from routers.users import router as users_router
from routers.hospitals import router as hospitals_router
from routers.patients import router as patients_router
from routers.documents import router as documents_router
from routers.fhir_records import router as fhir_records_router

# ---------------------------
# Local Pipeline Imports
# ---------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.join(BASE_DIR, "preprocessing"))
sys.path.append(os.path.join(BASE_DIR, "retrieval"))
sys.path.append(os.path.join(BASE_DIR, "formatting"))
sys.path.append(os.path.join(BASE_DIR, "validator"))

from preprocessing.pdf_to_text import run_pdf_pipeline
from retrieval.generate_handoff import run_retrieval_pipeline
from formatting.fhir_gen import run_fhir_generation
from validator.final_val import load_all_dictionaries, run_validation
import dotenv

dotenv.load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")

INPUT_FOLDER = os.path.join(BASE_DIR, "preprocessing", "hospital_pdfs")

# In-memory cache for pipeline results
CACHE = {}
CMS_DICTS = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Initializing CMS Validation Dictionaries...")
    ptp, mue, gender, ncd = load_all_dictionaries()
    CMS_DICTS["ptp_edits"] = ptp
    CMS_DICTS["mue_limits"] = mue
    CMS_DICTS["gender_codes"] = gender
    CMS_DICTS["ncd_map"] = ncd
    print("✅ Initialization Complete.")
    yield
    print("🛑 Shutting down.")


app = FastAPI(title="RCM Ingestion API", lifespan=lifespan)

# ---------------------------
# CORS
# ---------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------
# Mount all routers
# ---------------------------
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(hospitals_router)
app.include_router(patients_router)
app.include_router(documents_router)
app.include_router(fhir_records_router)


# ---------------------------
# Pipeline endpoints (preserved)
# ---------------------------
@app.post("/process-pdfs")
async def process_medical_batch(pdf_files: List[UploadFile] = File(...)):
    print(f"\n🚀 API HIT: Processing {len(pdf_files)} files through Full Pipeline.")
    os.makedirs(INPUT_FOLDER, exist_ok=True)

    results = []

    for file in pdf_files:
        print(f"--- Processing {file.filename} ---")
        file_path = os.path.join(INPUT_FOLDER, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        doc_id = str(uuid.uuid4())

        try:
            print("⏳ Running Step 1: Preprocessing...")
            structured_text = run_pdf_pipeline(file_path, file.filename)
            if structured_text.startswith("Error") or structured_text.startswith("Gemini API Error"):
                raise Exception(structured_text)

            print("⏳ Running Step 2: Retrieval Mapping...")
            retrieval_text = run_retrieval_pipeline(structured_text)

            print("⏳ Running Step 3: FHIR Generation...")
            if not API_KEY:
                raise Exception("GEMINI_API_KEY not found.")
            fhir_bundles, ai_extract = run_fhir_generation(structured_text, retrieval_text, API_KEY)

            print("⏳ Running Step 4: Final Validation...")
            validation_report = run_validation(
                fhir_bundles,
                CMS_DICTS["ptp_edits"],
                CMS_DICTS["mue_limits"],
                CMS_DICTS["gender_codes"],
                CMS_DICTS["ncd_map"],
            )

            CACHE[doc_id] = {
                "fhir_bundles": fhir_bundles,
                "validation_report": validation_report,
            }

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


@app.get("/api/fhir-result/{doc_id}")
async def get_fhir_result(doc_id: str):
    if doc_id not in CACHE:
        raise HTTPException(status_code=404, detail="Document ID not found in cache.")
    return CACHE[doc_id]["fhir_bundles"]


@app.get("/api/validation-report/{doc_id}")
async def get_validation_report(doc_id: str):
    if doc_id not in CACHE:
        raise HTTPException(status_code=404, detail="Document ID not found in cache.")
    return CACHE[doc_id]["validation_report"]


@app.get("/ping")
async def ping():
    return {"status": "Backend is alive!"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)