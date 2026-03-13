# AI-Powered RCM Normalization Engine

An enterprise-grade Revenue Cycle Management (RCM) pipeline that ingests unstructured hospital documents (PDFs/TXT), extracts clinical and financial entities using Agentic AI, and maps them to strictly validated HL7 FHIR (R4) Bundles for insurance claim submission.

## Architecture Overview
1. **Ingestion Module:** Uses `PyMuPDF` to read raw documents.
2. **AI Extraction Layer:** Uses Gemini 2.5 Flash with `Pydantic` Structured Outputs to enforce a strict JSON schema and prevent hallucination.
3. **FHIR Mapping Engine:** Uses `fhir.resources` to generate 100% compliant `Patient`, `Encounter`, and `Claim` bundles.

## Prerequisites
* Python 3.9 or higher

## 1. Project Structure
Ensure your local environment matches this exact structure before running:

rcm_engine/
├── data/
│   ├── input/               # Place hospital PDFs/TXT files here
│   └── output/              # Generated FHIR JSONs will appear here
├── .env                     # Create this file for your API key (DO NOT COMMIT)
├── .gitignore               # Ensures .env is never uploaded
├── requirements.txt         # Project dependencies
├── ai_extractor.py          # AI Extraction Logic
└── main.py                  # FHIR Bundle Generation Logic

## 2. Environment Setup
Run the following commands in your terminal to set up the dependencies:

pip install -r requirements.txt

## 3. Security & API Keys (CRITICAL)
**DO NOT hardcode API keys into the Python scripts.** 1. Create a file named `.env` in the root directory.
2. Add the Gemini API key inside the `.env` file exactly like this:
   GEMINI_API_KEY="your_actual_api_key_here"
3. Ensure `.env` is listed in your `.gitignore` file. The scripts are already configured to load this silently.

## 4. How to Run the Pipeline

**Step A: Prepare the Data**
Drop your sample hospital invoice or discharge summary into the `data/input/` folder. Ensure the filename matches what is set in the script (e.g., `hospital_data.txt`).

**Step B: Execute the Engine**
Run the main pipeline from your terminal:

python main.py

**Step C: Verify Output**
Check the `data/output/` folder. You will see individual, FHIR-compliant JSON files for every patient detected in the input document.

## Troubleshooting

* **API Key Error:** If the script crashes asking for an API key, ensure your `.env` file is in the root folder and spelled correctly (no spaces around the `=`).
* **Validation Fatal Error:** If testing the output JSON in the HL7 Validator and you get a "Fatal: Unable to infer format" error at Line 0, ensure you are uploading the actual `.json` file from the output folder, NOT copy-pasting terminal output.