import os
from datetime import datetime
from dotenv import load_dotenv

# 1. NEW IMPORTS: Import your AI logic from the other file
from ai_extractor import run_ai_extraction, extract_text_from_file

# FHIR Imports
from fhir.resources.patient import Patient
from fhir.resources.claim import Claim, ClaimItem
from fhir.resources.bundle import Bundle, BundleEntry
from fhir.resources.codeableconcept import CodeableConcept
from fhir.resources.reference import Reference
from fhir.resources.claim import ClaimDiagnosis

# --- CONFIGURATION ---
INPUT_FILE = "data/input/structured_hospital_data.txt"
OUTPUT_DIR = "data/output"

# Mock RAG Database (Until your teammate finishes the real one)
CODING_DATABASE = {
    "Healthy India 2021 Full Body Checkup With Vitamin Screening": {
        "cpt_code": "99386", 
        "icd_10": "Z00.00"   
    }
}

def build_fhir_bundle(patient_obj, invoice_date, patient_id):
    """
    Converts a single patient's Pydantic object (from the AI) into a FHIR Bundle.
    """
    # Grab the first service extracted by the AI
    test_desc = patient_obj.services[0].description if patient_obj.services else "Unknown Test"
    
    # RAG Lookup
    codes = CODING_DATABASE.get(test_desc, {"cpt_code": "99386", "icd_10": "Z00.00"}) # Defaults for safety if not found

    # Build Patient
    name_parts = patient_obj.full_name.split(" ")
    fhir_patient = Patient(
        id=f"pat-{patient_id}",
        name=[{"family": name_parts[-1], "given": name_parts[:-1]}]
    )

    # Build Claim
    fhir_claim = Claim(
        id=f"claim-{patient_id}",
        status="active",
        
        # --- THE MANDATORY FIELDS WE ACCIDENTALLY DELETED ---
        type=CodeableConcept(coding=[{"system": "http://terminology.hl7.org/CodeSystem/claim-type", "code": "professional"}]),
        use="claim",  # <-- Pydantic was crying for this
        patient=Reference(reference=f"Patient/{fhir_patient.id}"),
        created=invoice_date, # <-- And crying for this
        provider=Reference(reference="Organization/ExpedientHealthcare"),
        priority=CodeableConcept(coding=[{"system": "http://terminology.hl7.org/CodeSystem/processpriority", "code": "normal"}]),
        # ---------------------------------------------------

        # --- THE NEW ICD-10 DIAGNOSIS BLOCK ---
        diagnosis=[
            ClaimDiagnosis(
                sequence=1,
                diagnosisCodeableConcept=CodeableConcept(
                    coding=[{
                        "system": "http://hl7.org/fhir/sid/icd-10-cm", 
                        "code": codes["icd_10"], 
                        "display": "Encounter for general adult medical examination"
                    }]
                )
            )
        ],
        
        # --- THE UPDATED CPT ITEM BLOCK (Now linked to Diagnosis) ---
        item=[
            ClaimItem(
                sequence=1,
                diagnosisSequence=[1], # Points to the ICD-10 above
                productOrService=CodeableConcept(
                    coding=[{"system": "http://www.ama-assn.org/go/cpt", "code": codes["cpt_code"], "display": "PREV VISIT NEW AGE 40-64"}],
                    text=test_desc 
                )
            )
        ]
    )

    # Wrap in Bundle
    bundle = Bundle(
        id=f"bundle-{patient_id}",
        type="collection",
        entry=[
            BundleEntry(fullUrl=f"http://hackathon.local/fhir/Patient/{fhir_patient.id}", resource=fhir_patient),
            BundleEntry(fullUrl=f"http://hackathon.local/fhir/Claim/{fhir_claim.id}", resource=fhir_claim)
        ]
    )
    
    return bundle

def main():
    # Load Environment Variables securely
    load_dotenv()
    API_KEY = os.getenv("GEMINI_API_KEY")
    if not API_KEY:
        raise ValueError("API key not found! Please check your .env file.")

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    print(f"1. Reading raw file: {INPUT_FILE}")
    if not os.path.exists(INPUT_FILE):
        raise FileNotFoundError(f"File not found at: {INPUT_FILE}")
        
    raw_text = extract_text_from_file(INPUT_FILE)

    print("2. Sending text to Gemini AI for structural extraction...")
    # This calls your ai_extractor.py logic!
    ai_document = run_ai_extraction(raw_text, API_KEY)
    
    invoice_date = ai_document.invoice_date
    print(f"   -> AI found Invoice Date: {invoice_date}")
    print(f"   -> AI found {len(ai_document.patients)} patients.")

    print("\n3. Generating HL7 FHIR Bundles...")
    # Loop through the Pydantic objects returned by the AI
    for index, patient_obj in enumerate(ai_document.patients):
        print(f"   -> Mapping FHIR for {patient_obj.full_name}...")
        
        bundle = build_fhir_bundle(patient_obj, invoice_date, patient_id=f"100{index}")
        
        filename = f"{OUTPUT_DIR}/claim_{patient_obj.full_name.replace(' ', '_')}.json"
        with open(filename, "w") as f:
            f.write(bundle.json(indent=2))
            
    print("\nSuccess! End-to-End Pipeline Complete.")

if __name__ == "__main__":
    main()