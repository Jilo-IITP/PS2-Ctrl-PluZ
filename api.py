import os
import sys
import dotenv
from typing import List
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

# ---------------------------
# Robust Path Initialization
# ---------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

# ---------------------------
# Router imports (new MVC)
# ---------------------------
from routers.auth import router as auth_router
from routers.users import router as users_router
from routers.hospitals import router as hospitals_router
from routers.patients import router as patients_router
from routers.documents import router as documents_router
from routers.fhir_records import router as fhir_records_router
from routers.pipeline import router as pipeline_router
from routers.settlement import router as settlement_router

# Legacy sub-module imports for validation initialization
from validator.final_val import load_all_dictionaries

dotenv.load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initializes global resources on startup."""
    print("🚀 Initializing CMS Validation Dictionaries...")
    # Store in app.state for retrieval by routers/controllers
    try:
        ptp, mue, gender, ncd = load_all_dictionaries()
        app.state.cms_dicts = {
            "ptp_edits": ptp,
            "mue_limits": mue,
            "gender_codes": gender,
            "ncd_map": ncd
        }
        print("✅ Initialization Complete.")
    except Exception as e:
        print(f"⚠️ Warning: Failed to load CMS dictionaries: {e}")
        app.state.cms_dicts = {}
        
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
app.include_router(pipeline_router)
app.include_router(settlement_router)

# ---------------------------
# Utility Endpoints
# ---------------------------

@app.get("/api/generate-mediassist")
async def generate_mediassist():
    """Utility endpoint to trigger MediAssist JSON generation."""
    try:
        from formatting.mediassist_json_gen import generate_mediassist_json
        data = generate_mediassist_json()
        return {"status": "success", "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/ping")
async def ping():
    return {"status": "Backend is alive!"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)