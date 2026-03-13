from final_df import get_cached_df, load_ptps, load_mues, load_oce_demographics, load_ncd_crosswalk
from final_dict import build_dictionaries
import os
from fhir.resources.claim import Claim
from fhir.resources.patient import Patient
import json
import pandas as pd

# 1. Load the fast caches
base_dir = r"C..\data"
ptp_df = get_cached_df("cache_ptp.pkl", base_dir, "ccipra*", skiprows=1)
mue_df = get_cached_df("cache_mue.pkl", base_dir, "MCR_MUE*", skiprows=1)
hcpcs_df = get_cached_df("cache_hcpcs.pkl", base_dir, "Data_HCPCS.txt", skiprows=0)
ncd_df = get_cached_df("cache_ncd.pkl", base_dir, "*Initial-ICD10-NCD-Spreadsheet*", skiprows=0)

# 2. Build the dictionaries (Including NCD)
PTP_EDITS, MUE_LIMITS, GENDER_SPECIFIC_CODES, NCD_MAP = build_dictionaries(ptp_df, mue_df, hcpcs_df, ncd_df)

print(f"Total MUE Codes Loaded: {len(MUE_LIMITS)}")
print(f"Total Gender Codes Loaded: {len(GENDER_SPECIFIC_CODES)}")
print(f"Total PTP Base Codes Loaded: {len(PTP_EDITS)}")
print(f"Total NCD Policies Loaded: {len(NCD_MAP)}")

class FHIRAnomalyDetector:
    def __init__(self, bundle_json, ptp_edits, mue_limits, gender_codes, ncd_map):
        self.data = bundle_json
        self.anomalies = []
        
        # Inject the O(1) dictionaries
        self.ptp_edits = ptp_edits
        self.mue_limits = mue_limits
        self.gender_codes = gender_codes
        self.ncd_map = ncd_map
        
        # Map ALL patients in the bundle
        self.patients_map = self._build_patient_map()

    def _build_patient_map(self):
        """Creates an O(1) lookup map of all patients in the bundle by their Reference ID."""
        p_map = {}
        for entry in self.data.get('entry', []):
            resource = entry.get('resource', {})
            if resource.get('resourceType') == 'Patient':
                pat = Patient.model_validate(resource)
                p_map[f"Patient/{pat.id}"] = pat
        return p_map

    def analyze(self):
        """Iterates through resources and identifies anomalies."""
        for entry in self.data.get('entry', []):
            resource = entry.get('resource', {})
            if resource.get('resourceType') == 'Claim':
                claim_obj = Claim.model_validate(resource)
                self._check_claim(claim_obj)
        return self.anomalies

    def _check_claim(self, claim):
        processed_items = []
        patient_ref = claim.patient.reference if claim.patient else "Unknown"
        
        # Grab the specific patient for THIS specific claim
        current_patient = self.patients_map.get(patient_ref)

        # 1. First, collect all codes and their line numbers from the claim
        for item in claim.item:
            line_no = item.sequence
            # Safety check in case coding is missing
            if item.productOrService and item.productOrService.coding:
                # Aggressive string strip before lookup
                hcpcs_code = str(item.productOrService.coding[0].code).strip()
                quantity = item.quantity.value if item.quantity else 1
                processed_items.append({"line": line_no, "code": hcpcs_code, "qty": quantity})

        # 2. Run the Line-by-Line Checks (MUE & Gender)
        for entry in processed_items:
            code = entry["code"]
            line = entry["line"]
            qty = entry["qty"]

            # MUE CHECK
            if code in self.mue_limits and qty > self.mue_limits[code]:
                self._report(line, code, "MUE_VIOLATION", 
                             f"Units ({qty}) exceed CMS limit ({self.mue_limits[code]}).", patient_ref)

            # GENDER CHECK
            if code in self.gender_codes:
                required = self.gender_codes[code]
                if current_patient and current_patient.gender != required:
                    self._report(line, code, "GENDER_MISMATCH", 
                                 f"Procedure for {required} billed for {current_patient.gender}.", patient_ref)

        # 3. THE UNBUNDLING CHECK (PTP) 
        for i in range(len(processed_items)):
            for j in range(len(processed_items)):
                if i == j: continue  
                
                comprehensive_code = processed_items[i]["code"]
                component_code = processed_items[j]["code"]
                
                # Check if comprehensive_code exists in dict, AND if component_code is in its set of unbundled codes
                if comprehensive_code in self.ptp_edits and component_code in self.ptp_edits[comprehensive_code]:
                    self._report(processed_items[j]["line"], component_code, "UNBUNDLING_VIOLATION", 
                                 f"Code {component_code} is bundled into {comprehensive_code}. Cannot be billed together.", patient_ref)

        # 4. MEDICAL NECESSITY CHECK (NCD)
        self._check_medical_necessity(claim, patient_ref)

    def _check_medical_necessity(self, claim, patient_ref):
        """Checks if the CPT code is supported by the Diagnosis codes (NCD)."""
        claim_dx_codes = []
        if getattr(claim, 'diagnosis', None):
            for dx in claim.diagnosis:
                if dx.diagnosisCodeableConcept and dx.diagnosisCodeableConcept.coding:
                    # Strip DX code too just in case
                    claim_dx_codes.append(str(dx.diagnosisCodeableConcept.coding[0].code).strip())

        # Skip check if no diagnoses were provided on the claim to prevent false positives
        if not claim_dx_codes:
            return

        for item in claim.item:
            if item.productOrService and item.productOrService.coding:
                cpt = str(item.productOrService.coding[0].code).strip()
                
                # If this CPT has NCD rules applied to it
                if cpt in self.ncd_map:
                    allowed_dx_set = self.ncd_map[cpt] 
                    
                    # If NONE of the claim's DX codes are in the 'Allowed' set for this CPT
                    if not any(dx in allowed_dx_set for dx in claim_dx_codes):
                        self._report(item.sequence, cpt, "MEDICAL_NECESSITY_VIOLATION", 
                                     f"Procedure {cpt} not supported by provided diagnoses.", patient_ref)
                    
    def _report(self, line, codes, reason, details, patient_ref):
        self.anomalies.append({
            "line_number": line,
            "codes": codes,
            "context": f"Patient Reference: {patient_ref}",
            "suspicion_reason": reason,
            "details": details,
            "severity": "High"
        })

import glob # Make sure to add this import!

# --- 5. EXECUTION & FHIR OUTPUT GENERATION ---

print("\n--- INGESTING AI-GENERATED FHIR BUNDLES ---")

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
output_folder_pattern = os.path.join(PROJECT_ROOT, "data", "output", "claim_*.json")
ai_generated_files = glob.glob(output_folder_pattern)

if not ai_generated_files:
    print(f"❌ No AI generated FHIR files found in {output_folder}")
    print("Please run fhir_gen.py first!")
else:
    all_results = []
    
    for filepath in ai_generated_files:
        print(f"🔍 Analyzing {filepath}...")
        
        with open(filepath, "r") as f:
            fhir_input = json.load(f)

        detector = FHIRAnomalyDetector(fhir_input, PTP_EDITS, MUE_LIMITS, GENDER_SPECIFIC_CODES, NCD_MAP)
        results = detector.analyze()
        all_results.extend(results) 

    if all_results:
        print(f"\n🚨 FOUND {len(all_results)} TOTAL ANOMALIES ACROSS ALL AI FILES 🚨")
        
        operation_outcome = {
            "resourceType": "OperationOutcome",
            "id": "validation-results-001",
            "issue": []
        }

        for anomaly in all_results:
            issue = {
                "severity": "error", 
                "code": "business-rule", 
                "details": {
                    "text": anomaly['suspicion_reason']
                },
                "diagnostics": f"Line {anomaly['line_number']} (Code {anomaly['codes']}): {anomaly['details']}",
                "expression": [
                    anomaly['context']
                ]
            }
            operation_outcome["issue"].append(issue)

        output_filename = "audit_results.json"
        with open(output_filename, "w") as f:
            json.dump(operation_outcome, f, indent=2)

        print(f"✅ Successfully exported FHIR OperationOutcome to: {output_filename}")
        
        df_results = pd.DataFrame(all_results)
        print("-" * 50)
        print(df_results['suspicion_reason'].value_counts())
        print("-" * 50)

    else:
        print("\n✅ All AI-generated claims passed! No anomalies detected.")