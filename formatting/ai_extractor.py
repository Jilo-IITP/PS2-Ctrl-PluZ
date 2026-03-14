import fitz  # PyMuPDF
import json
from pydantic import BaseModel, Field
from typing import List, Optional
from google import genai
from google.genai import types
from dotenv import load_dotenv
import os

load_dotenv()

# --- 1. DEFINE THE STRICT SCHEMA ---
class ExtractedService(BaseModel):
    description: str = Field(description="The name of the test, procedure, or medical service provided.")
    amount: Optional[float] = Field(description="The billed amount for this specific service. Null if not found.")
    cpt_code_mentioned: Optional[str] = Field(description="The CPT or SAC code if explicitly mentioned in the text.")

class ExtractedDiagnosis(BaseModel):
    condition: str = Field(description="The medical condition or diagnosis name.")
    icd_10_code: Optional[str] = Field(description="The exact ICD-10 code for the condition if found in the text.")

class ExtractedPatient(BaseModel):
    full_name: str = Field(description="The full name of the patient receiving the service.")
    gender: Optional[str] = Field(description="Gender of the patient (male, female, other, unknown).")
    age: Optional[str] = Field(description="Age of the patient as a string.")
    doctor_name: Optional[str] = Field(description="Name of the ordering or attending doctor.")
    diagnoses: List[ExtractedDiagnosis] = Field(description="List of medical conditions and their codes. Empty list if none found.")
    services: List[ExtractedService] = Field(description="List of services or tests performed on THIS specific patient.")

class HospitalDocument(BaseModel):
    invoice_number: Optional[str] = Field(description="The main invoice or bill number.")
    invoice_date: str = Field(description="The date of the invoice in YYYY-MM-DD format. Default to 1970-01-01 if missing.")
    hospital_name: Optional[str] = Field(description="The name of the hospital or billing company.")
    patients: List[ExtractedPatient] = Field(description="List of all patients found in the document.")

# --- 2. THE EXTRACTION LOGIC ---
def extract_text_from_file(filepath: str) -> str:
    """Reads both .txt and .pdf files robustly."""
    text = ""
    if filepath.lower().endswith('.pdf'):
        doc = fitz.open(filepath)
        for page in doc:
            text += page.get_text("text") + "\n"
    else:
        with open(filepath, 'r', encoding='utf-8') as f:
            text = f.read()
    return text

def run_ai_extraction(raw_text: str, api_key: str) -> HospitalDocument:
    """Passes the raw text to the LLM and forces a Pydantic-validated JSON return."""
    client = genai.Client(api_key=api_key)
    
    prompt = f"""
    You are an expert medical coder and Revenue Cycle Management (RCM) auditor.
    Your job is to read the following raw OCR text from a hospital document and extract the clinical and billing data.
    
    CRITICAL RULES:
    1. If there are multiple patients on a single invoice, separate their services strictly into different patient objects.
    2. Convert all dates to YYYY-MM-DD.
    3. Do NOT invent or hallucinate diagnoses or codes. Extract exact ICD-10 or CPT codes only if present in the text.
    4. Link the correct ordering doctor and diagnoses to the corresponding patient.
    
    RAW TEXT:
    {raw_text}
    """
    
    print("Calling AI for structured extraction...")
    
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=HospitalDocument,
            temperature=0.1 
        ),
    )
    
    extracted_data = HospitalDocument.model_validate_json(response.text)
    return extracted_data

# --- 3. TEST THE PIPELINE ---
if __name__ == "__main__":
    API_KEY = os.getenv("GEMINI_API_KEY")
    if not API_KEY:
        raise ValueError("API key not found! Please check your .env file.")
    
    file_path_1 = "data/input/lele_abhav_noobde.txt"
    file_path_2 = "retrieval/data_from_preprocessing/structured_hospital_data.txt"
    
    paths = [file_path_1, file_path_2]
    for p in paths:
        if not os.path.exists(p):
            raise FileNotFoundError(f"Bhai, file nahi mili at: {p}")
    
    text_1 = extract_text_from_file(file_path_1)
    text_2 = extract_text_from_file(file_path_2)

    combined_raw_text = f"""
    --- SOURCE 1 (Input Data) ---
    {text_1}
    
    --- SOURCE 2 (Retrieved/Preprocessed Data) ---
    {text_2}
    """
    structured_output = run_ai_extraction(combined_raw_text, API_KEY)
    
    print("\n--- AI EXTRACTED STRUCTURED DATA ---")
    print(structured_output.model_dump_json(indent=2))