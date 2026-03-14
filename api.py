import os
import shutil
from typing import List
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

INPUT_FOLDER = os.path.join(BASE_DIR, "preprocessing", "hospital_pdfs")
app = FastAPI(title="RCM Ingestion API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/process-pdfs")
async def receive_pdfs_only(pdf_files: List[UploadFile] = File(...)):
    print(f"\n🚀 API HIT: Received {len(pdf_files)} files from React Dashboard.")
    
    # Ensure the folder exists
    os.makedirs(INPUT_FOLDER, exist_ok=True)
    
    # Just save the files and do nothing else!
    saved_paths = []
    for file in pdf_files:
        file_path = os.path.join(INPUT_FOLDER, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        saved_paths.append(file_path)
        print(f"📁 SUCCESS: File dropped directly into -> {file_path}")

    return {
        "status": "success", 
        "message": f"{len(pdf_files)} files safely stored in hospital_pdfs folder. No AI processing triggered.",
        "files_saved": saved_paths
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)