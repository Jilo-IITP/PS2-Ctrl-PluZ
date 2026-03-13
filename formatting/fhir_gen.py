import os
from datetime import datetime
from dotenv import load_dotenv

from ai_extractor import run_ai_extraction, extract_text_from_file

from fhir.resources.patient import Patient
from fhir.resources.claim import Claim, ClaimItem
from fhir.resources.bundle import Bundle, BundleEntry
from fhir.resources.codeableconcept import CodeableConcept
from fhir.resources.reference import Reference
from fhir.resources.claim import ClaimDiagnosis

# --- CONFIGURATION ---
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR) 

# Pointing to the text file we just updated
file_path_1 = "data/input/lele_abhav_noobde.txt"
file_path_2 = "retrieval/data_from_preprocessing/structured_hospital_data.txt"
OUTPUT_DIR = os.path.join(PROJECT_ROOT, "data", "output")

CODING_DATABASE = {
    "Routine Checkup": { "cpt_code": "99386", "icd_10": "Z00.00" }
}

def build_fhir_bundle(patient_obj, invoice_date, patient_id):
    name_parts = patient_obj.full_name.split(" ")
    fhir_patient = Patient(
        id=f"pat-{patient_id}",
        name=[{"family": name_parts[-1], "given": name_parts[:-1]}],
        gender="female" # The crucial gender injection!
    )

    claim_items = []
    for i, service in enumerate(patient_obj.services):
        if service.cpt_code_mentioned:
            cpt = service.cpt_code_mentioned
        else:
            codes = CODING_DATABASE.get(service.description, {"cpt_code": "99386", "icd_10": "Z00.00"})
            cpt = codes["cpt_code"]

        claim_items.append(
            ClaimItem(
                sequence=i + 1,
                diagnosisSequence=[1], 
                productOrService=CodeableConcept(
                    coding=[{"system": "http://www.ama-assn.org/go/cpt", "code": cpt}],
                    text=service.description 
                )
            )
        )

    fhir_claim = Claim(
        id=f"claim-{patient_id}",
        status="active",
        type=CodeableConcept(coding=[{"system": "http://terminology.hl7.org/CodeSystem/claim-type", "code": "professional"}]),
        use="claim",
        patient=Reference(reference=f"Patient/{fhir_patient.id}"),
        created=invoice_date,
        provider=Reference(reference="Organization/ExpedientHealthcare"),
        priority=CodeableConcept(coding=[{"system": "http://terminology.hl7.org/CodeSystem/processpriority", "code": "normal"}]),
        
        diagnosis=[
            ClaimDiagnosis(
                sequence=1,
                diagnosisCodeableConcept=CodeableConcept(
                    coding=[{
                        "system": "http://hl7.org/fhir/sid/icd-10-cm", 
                        "code": "Z00.00", 
                        "display": "Encounter for general adult medical examination"
                    }]
                )
            )
        ],
        item=claim_items
    )

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
        bundle = build_fhir_bundle(patient_obj, invoice_date, patient_id=f"100{index}")
        
        filename = f"{OUTPUT_DIR}/claim_{patient_obj.full_name.replace(' ', '_')}.json"
        with open(filename, "w") as f:
            f.write(bundle.json(indent=2))
            
    print("\nSuccess! End-to-End Pipeline Complete.")

if __name__ == "__main__":
    main()