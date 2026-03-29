import os
import re
import json
import sys
from dotenv import load_dotenv

# ---------------------------
# Robust Path Initialization
# ---------------------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

from core.supabase import get_supabase

# Load environment variables
load_dotenv()

# Initialize Supabase Client from Singleton
try:
    supabase = get_supabase()
    print("✅ Supabase client initialized via singleton.")
except Exception as e:
    print(f"❌ Failed to initialize Supabase client: {e}")
    supabase = None

def parse_hospital_data(file_path):
    """Parses the structured_hospital_data.txt file into a dictionary."""
    data = {}
    if not os.path.exists(file_path):
        print(f"⚠️ {file_path} not found.")
        return data

    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Regex to catch Key: Value patterns
    kv_pairs = re.findall(r"\*\s*\*\*(.*?):\*\*(.*)", content)
    for k, v in kv_pairs:
        key = k.strip()
        val = v.strip()
        if val.lower() == "n/a" or "(information missing)" in val.lower():
            val = ""
        data[key] = val

    # Special handling for tables if needed (Ward, Billing)
    # For now, we focus on the main fields for the PDF header
    return data

def parse_clinical_data(file_path):
    """Parses the reti_output.txt file."""
    data = {"clinical_context": ""}
    if not os.path.exists(file_path):
        print(f"⚠️ {file_path} not found.")
        return data

    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    if "No valid clinical diagnoses found" in content:
        data["clinical_context"] = ""
    else:
        # Extract everything after the header
        match = re.search(r"=== VERITAS AI: NORMALIZED CLINICAL CONTEXT ===\n\n(.*)", content, re.DOTALL)
        if match:
            data["clinical_context"] = match.group(1).strip()
    
    return data

def fetch_supabase_hospital(hospital_name):
    """Fetches full hospital info from Supabase."""
    if not supabase or not hospital_name:
        return {}
    
    try:
        response = supabase.table("hospitals").select("*").ilike("name", f"%{hospital_name}%").execute()
        if response.data:
            return response.data[0]
    except Exception as e:
        print(f"❌ Error fetching hospital: {e}")
    return {}

def fetch_supabase_patient(uhid):
    """Fetches full patient info from Supabase."""
    if not supabase or not uhid:
        return {}
    
    try:
        response = supabase.table("patients").select("*").eq("uhid", uhid).execute()
        if response.data:
            return response.data[0]
    except Exception as e:
        print(f"❌ Error fetching patient: {e}")
    return {}

def generate_mediassist_json():
    # Paths
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    hospital_data_path = os.path.join(BASE_DIR, "retrieval", "data_from_preprocessing", "structured_hospital_data.txt")
    clinical_data_path = os.path.join(BASE_DIR, "data", "input", "reti_output.txt")
    output_path = os.path.join(BASE_DIR, "data", "output", "mediassist_data.json")
    
    # 1. Parse local text files
    print("Parsing text files...")
    hosp_parsed = parse_hospital_data(hospital_data_path)
    clin_parsed = parse_clinical_data(clinical_data_path)
    
    # 2. Fetch from Supabase
    hosp_name = hosp_parsed.get("Hospital Name", "")
    uhid = hosp_parsed.get("UHID", "")
    
    print(f"Fetching Supabase data for Hospital: {hosp_name}, UHID: {uhid}...")
    db_hospital = fetch_supabase_hospital(hosp_name)
    db_patient = fetch_supabase_patient(uhid)
    
    # 3. Merge data
    # Priority: DB > Extracted Text
    final_data = {
        "HospitalName": db_hospital.get("name") or hosp_parsed.get("Hospital Name", ""),
        "HospitalAddress": db_hospital.get("address") or hosp_parsed.get("Address", ""),
        "HospitalROHINI_ID": db_hospital.get("gstin") or hosp_parsed.get("GSTIN", ""),
        "HospitalPhone": db_hospital.get("phone", ""),
        "HospitalID": db_hospital.get("id", ""),
        "HospitalEmail_ID": db_hospital.get("email", ""),

        "PatientName": db_patient.get("full_name") or hosp_parsed.get("Patient Name", ""),
        "UHID": uhid,
        "PatientAge": db_patient.get("age") or hosp_parsed.get("Age/Sex", "").split("/")[0] if "/" in hosp_parsed.get("Age/Sex", "") else "",
        "PatientGender": db_patient.get("gender") or hosp_parsed.get("Age/Sex", "").split("/")[1] if "/" in hosp_parsed.get("Age/Sex", "") else "",
        "PatientMobile": db_patient.get("mobile") or hosp_parsed.get("Mobile Number", ""),
        "PatientAddress": db_patient.get("address") or hosp_parsed.get("Address", ""),
        "Patient_Policy_No": db_patient.get("policy_no", ""),
        "PatientBirthDate": db_patient.get("dob", ""),
        "PatientEmployee_ID": db_patient.get("employee_id", ""),
        "Patient_occupation": db_patient.get("occupation", ""),
        "Patient_Insurer_Name": db_patient.get("insurer_name", ""),
        "Patient_Insurer_ID": db_patient.get("insurer_id", ""),

        "AdmissionDate": hosp_parsed.get("Admission Date", ""),
        "DischargeDate": hosp_parsed.get("Discharge Date", ""),
        "BillNumber": hosp_parsed.get("Bill Number", ""),
        "BillDate": hosp_parsed.get("Bill Date", ""),
        
        
        "Diagnosis": clin_parsed.get("clinical_context", ""),
        "Procedure": hosp_parsed.get("Package (IPD)", ""),
        
        "TotalAmount": hosp_parsed.get("Total Bill Amount", ""),
        "Discount": hosp_parsed.get("Total Discount Amount", ""),
        "Advance": hosp_parsed.get("Advance Received", ""),
        "NetTpaAmount": hosp_parsed.get("Net TPA/Corporate Amount", ""),
        
        "TPA": hosp_parsed.get("TPA", ""),
        "Corporate": hosp_parsed.get("Corporate", ""),
    }
    
    # Fill blanks for any missing keys
    for key, value in final_data.items():
        if value is None:
            final_data[key] = ""

    # 4. Save to JSON
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(final_data, f, indent=4)
    
    print(f"✅ Medi Assist JSON generated at: {output_path}")
    return final_data

if __name__ == "__main__":
    generate_mediassist_json()
