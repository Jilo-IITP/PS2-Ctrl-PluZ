import os
import uuid
from datetime import datetime
from dotenv import load_dotenv

from ai_extractor import run_ai_extraction, extract_text_from_file

from fhir.resources.patient import Patient
from fhir.resources.claim import Claim, ClaimItem, ClaimDiagnosis
from fhir.resources.bundle import Bundle, BundleEntry
from fhir.resources.codeableconcept import CodeableConcept
from fhir.resources.reference import Reference
from fhir.resources.narrative import Narrative

# --- CONFIGURATION ---
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR) 

file_path_1 = "data/input/lele_abhav_noobde.txt"
file_path_2 = "retrieval/data_from_preprocessing/structured_hospital_data.txt"
OUTPUT_DIR = os.path.join(PROJECT_ROOT, "data", "output")

def build_fhir_bundle(patient_obj, invoice_date):
    # Generate true UUIDs for FHIR compliance
    patient_uuid = str(uuid.uuid4())
    claim_uuid = str(uuid.uuid4())

    # 1. Map Patient Name & Gender dynamically
    name_parts = patient_obj.full_name.split(" ")
    family_name = name_parts[-1] if len(name_parts) > 1 else patient_obj.full_name
    given_name = name_parts[:-1] if len(name_parts) > 1 else [patient_obj.full_name]

    gender_val = "unknown"
    if patient_obj.gender:
        g = patient_obj.gender.lower()
        if g in ["male", "female", "other", "unknown"]:
            gender_val = g

    # Added Narrative (text) to satisfy dom-6 constraint
    fhir_patient = Patient(
        id=patient_uuid,
        text=Narrative(status="generated", div=f'<div xmlns="http://www.w3.org/1999/xhtml">{patient_obj.full_name}</div>'),
        name=[{"family": family_name, "given": given_name}],
        gender=gender_val 
    )

    # 2. Map Services dynamically
    claim_items = []
    has_diagnoses = len(patient_obj.diagnoses) > 0

    for i, service in enumerate(patient_obj.services):
        # FIX: If CPT is missing, only provide the text description to avoid 'UNKNOWN_CPT' validator errors
        if service.cpt_code_mentioned and service.cpt_code_mentioned.strip():
            concept = CodeableConcept(
                coding=[{"system": "http://www.ama-assn.org/go/cpt", "code": service.cpt_code_mentioned}],
                text=service.description 
            )
        else:
            concept = CodeableConcept(text=service.description)

        claim_items.append(
            ClaimItem(
                sequence=i + 1,
                diagnosisSequence=[1] if has_diagnoses else [], 
                productOrService=concept
            )
        )

    # 3. Map Diagnoses dynamically 
    diagnosis_list = []
    for d_idx, diag in enumerate(patient_obj.diagnoses):
        # Similar to CPT, if ICD is unknown, omit the coding block to prevent errors
        if diag.icd_10_code and diag.icd_10_code.strip():
            diag_concept = CodeableConcept(
                coding=[{
                    "system": "http://hl7.org/fhir/sid/icd-10-cm", 
                    "code": diag.icd_10_code, 
                    "display": diag.condition
                }]
            )
        else:
            diag_concept = CodeableConcept(text=diag.condition)

        diagnosis_list.append(
            ClaimDiagnosis(
                sequence=d_idx + 1,
                diagnosisCodeableConcept=diag_concept
            )
        )

    # 4. Map Provider dynamically
    provider_name = patient_obj.doctor_name if patient_obj.doctor_name else "Unknown Provider"

    fhir_claim = Claim(
        id=claim_uuid,
        text=Narrative(status="generated", div=f'<div xmlns="http://www.w3.org/1999/xhtml">Claim for {patient_obj.full_name}</div>'),
        status="active",
        type=CodeableConcept(coding=[{"system": "http://terminology.hl7.org/CodeSystem/claim-type", "code": "professional"}]),
        use="claim",
        patient=Reference(reference=f"urn:uuid:{patient_uuid}"), # FIX: Link directly to the urn:uuid to resolve properly
        created=invoice_date,
        provider=Reference(display=provider_name), # FIX: Using display instead of reference to avoid unresolvable Organization URL error
        priority=CodeableConcept(coding=[{"system": "http://terminology.hl7.org/CodeSystem/processpriority", "code": "normal"}]),
        diagnosis=diagnosis_list,
        item=claim_items
    )

    bundle = Bundle(
        id=str(uuid.uuid4()),
        type="collection",
        entry=[
            BundleEntry(fullUrl=f"urn:uuid:{patient_uuid}", resource=fhir_patient),
            BundleEntry(fullUrl=f"urn:uuid:{claim_uuid}", resource=fhir_claim)
        ]
    )
    return bundle

def main():
    load_dotenv()
  
    API_KEY = os.getenv("GEMINI_API_KEY")
    if not API_KEY:
        raise ValueError("API key not found! Please check your .env file.")

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
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

    print("2. Sending text to Gemini AI for structural extraction...")
    ai_document = run_ai_extraction(combined_raw_text, API_KEY)
    
    invoice_date = ai_document.invoice_date
    print(f"   -> AI found Invoice Date: {invoice_date}")
    print(f"   -> AI found {len(ai_document.patients)} patients.")

    print("\n3. Generating HL7 FHIR Bundles...")
    for index, patient_obj in enumerate(ai_document.patients):
        print(f"   -> Mapping FHIR for {patient_obj.full_name}...")
        bundle = build_fhir_bundle(patient_obj, invoice_date)
        
        filename = f"{OUTPUT_DIR}/claim_{patient_obj.full_name.replace(' ', '_')}.json"
        with open(filename, "w") as f:
            f.write(bundle.json(indent=2))
            
    print("\nSuccess! End-to-End Pipeline Complete.")

if __name__ == "__main__":
    main()