# AI-Powered RCM Normalization Engine & Frontend Dashboard

An enterprise-grade Revenue Cycle Management (RCM) pipeline that ingests unstructured hospital documents (PDFs/TXT), extracts clinical and financial entities using Agentic AI, and maps them to strictly validated HL7 FHIR (R4) Bundles for insurance claim submission. It features a FastAPI backend and a React/Vite frontend.

## Architecture Overview
1. **Frontend Dashboard:** A React application (built with Vite and TailwindCSS) that provides a user interface to upload files and view extraction results.
2. **FastAPI Backend:** Orchestrates the multi-step document processing pipeline.
3. **Ingestion Module:** Uses `pdf2image` and `easyocr` to read raw documents.
4. **AI Extraction Layer:** Uses Gemini 2.5 Flash with Prompt Engineering to structure data and enforce JSON schemas.
5. **FHIR Mapping Engine:** Uses `fhir.resources` to generate 100% compliant `Patient`, `Encounter`, and `Claim` bundles.
6. **Validation Engine:** Checks CMS rules, PTP edits, and MUE limits.

---

## 🛠️ Prerequisites

* **Python 3.9+**
* **Node.js (v18+)** for the frontend
* **Poppler** (Required for `pdf2image` to convert PDFs to images)

### Installing Poppler (CRITICAL)
## used for pdf to image conversion
Poppler is an external system dependency and must be installed for `pdf2image` to work.

**Windows:**
1. Download a pre-built Windows binary for Poppler from `https://github.com/oschwartz10612/poppler-windows/releases/`
2. Extract the downloaded `.zip` file into a folder (e.g., `C:\poppler`).
3. Add the `bin/` folder inside the extracted directory to your System **PATH** environment variable.
   - Example: Add `C:\poppler\Library\bin` to PATH.
4. Restart your terminal or computer to apply changes.

**Mac (Homebrew):**
```bash
brew install poppler
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install poppler-utils
```

---

## 🚀 1. Setup Instructions

Ensure your local environment matches this structure before running.

### Backend Setup (Python)

1. **Navigate to the root project directory:**
   ```bash
   cd Jilo
   ```

2. **Create a virtual environment (Optional but Recommended):**
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On Mac/Linux:
   source venv/bin/activate
   ```

3. **Install all Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up your Environment Variables (`.env`):**
   Create a `.env` file in the root `Jilo/` directory and add your Gemini API Key:
   ```env
   GEMINI_API_KEY="your_actual_api_key_here"
   ```
   *Note: Ensure `.env` is listed in your `.gitignore` to prevent leaking keys.*

### Frontend Setup (Node.js)

1. **Navigate to the frontend directory:**
   ```bash
   cd rcm-frontend
   ```

2. **Install frontend packages:**
   ```bash
   npm install
   ```

---

## 🏃 2. Running the Application

To run the full stack, you need to start the Backend and Frontend separately.

### Start the FastAPI Backend
1. Open a terminal in the root `Jilo/` directory.
2. Run the FastAPI server using Uvicorn:
   ```bash
   python api.py
   # Or using uvicorn directly:
   # uvicorn api:app --host 0.0.0.0 --port 8000 --reload
   ```
3. The API will be available at `http://localhost:8000`.
4. You can access the Swagger UI documentation at `http://localhost:8000/docs`.

### Start the React Frontend
1. Open a new, separate terminal in the `rcm-frontend/` directory.
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
3. Open your browser and navigate to the local link provided by Vite (usually `http://localhost:5173`).

---

## 🛠️ 3. How to Use the Pipeline

1. **Upload Documents:** Go to your local React frontend in the browser and use the drag-and-drop UI to upload sample hospital PDFs.
2. **Process Pipeline:** Once uploaded, click the process button. The frontend will hit the backend API's `/process-pdfs` endpoint.
3. **Behind the scenes:** The FastAPI backend will run:
   - **Step 1:** OCR PDF to Text (`pdf2image` + `easyocr`) & Structure using Gemini
   - **Step 2:** Retrieval Mapping
   - **Step 3:** FHIR Generation (`fhir.resources`)
   - **Step 4:** Final Validation (CMS rules processing)
4. **View Output:** Validation reports and FHIR JSON bundles will populate in the frontend dashboard.

---

## 🐛 Troubleshooting

* **`pdf2image.exceptions.PDFInfoNotInstalledError: Unable to get page count.`**
  - **Fix:** You did not install Poppler correctly or it is not in your system PATH. Follow the "Installing Poppler" instructions above, and restart your terminal.
* **API Key Error:** If the script crashes asking for an API key, ensure your `.env` file is in the root folder and spelled correctly (no spaces around the `=`).
* **Frontend doesn't connect to Backend:** Ensure FastAPI is running on `http://localhost:8000` and CORS issues are not blocking the Vite frontend (port `5173`).