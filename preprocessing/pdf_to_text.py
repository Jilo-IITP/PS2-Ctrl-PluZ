
import os
import easyocr
import google.generativeai as genai
# from pdf2image import convert_from_path
from pdf2image import convert_from_bytes
from dotenv import load_dotenv , find_dotenv

#keys in secrets tab

load_dotenv(find_dotenv()) 

api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)
#ocr model
reader = easyocr.Reader(['en'])
#gemini model
model = genai.GenerativeModel('models/gemini-2.5-flash')

from pdf2image import convert_from_bytes
import numpy as np
# Assuming your reader is initialized globally at the top of your file
# reader = easyocr.Reader(['en'])

def process_single_pdf(file_bytes: bytes, filename: str):
    """Converts PDF bytes directly to text using EasyOCR in memory."""
    print(f"--- Extracting text from: {filename} ---")

    try:
        # Load PDF directly from the downloaded bytes (No disk I/O!)
        images = convert_from_bytes(file_bytes)
    except Exception as e:
        return f"Error reading PDF: {e}"

    raw_text = ""
    for image in images:
        # EasyOCR can read numpy arrays directly. 
        # This skips the slow image.save() and os.remove() steps entirely.
        img_array = np.array(image)
        
        result = reader.readtext(img_array, detail=0)
        if result:
            raw_text += " ".join(result) + " "

    return raw_text

def structure_text_with_gemini(raw_text, filename):
    """Sends messy text to Gemini for cleaning and structuring."""
    prompt = f"""
    It is unstructured OCR output. Please:
    1. Clean it up (fix typos, remove page numbers and hospital headers).
    2. Structure it into sections: [Patient Info, Billing/Charges, Medications, Diagnosis].
    3. Use Markdown tables for any billing items or test result lists.
    **Document Identification:** From the merged content, identify and list the original document types (e.g., Bill, Blood Report, Discharge Summary). Use specific markers from the text (like 'Invoice #123' or 'Lab Date: March 20') to show where each document was found.

    RAW TEXT:
    {raw_text}
    """
    try:
        response = model.generate_content(prompt)
        #print(response.text)
        return response.text
    except Exception as e:
        return f"Gemini API Error: {e}"

def run_pdf_pipeline(pdf_path: str, filename: str) -> str:
    """Orchestrates the PDF processing directly from early stages without hitting disk for output."""
    raw_content = process_single_pdf(pdf_path)
    structured_data = structure_text_with_gemini(raw_content, filename)
    return structured_data

def main():
    # Use absolute paths relative to this script's directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    input_folder = os.path.join(script_dir, "hospital_pdfs")
    
    # Point to the retrieval data folder relative to this script
    output_folder = os.path.abspath(os.path.join(script_dir, "..", "retrieval", "data_from_preprocessing"))
    output_file = os.path.join(output_folder, "structured_hospital_data.txt")

    if not os.path.exists(input_folder):
        os.makedirs(input_folder)
        print(f"Created folder '{input_folder}'. Please upload your PDFs inside it and run again.")
        return

    pdf_files = [f for f in os.listdir(input_folder) if f.lower().endswith(".pdf")]

    if not pdf_files:
        print(f"No PDF files found in '{input_folder}'. Upload them to the sidebar folder.")
        return

    combined_raw_text = ""
    with open(output_file, "w", encoding="utf-8") as master_file:
        for filename in pdf_files:
            pdf_path = os.path.join(input_folder, filename)
            # OCR Extraction for each file
            raw_content = process_single_pdf(pdf_path)
            combined_raw_text += f"\n--- Source File: {filename} ---\n" + raw_content

    print(f"Structuring all data from {len(pdf_files)} files")  

    structured_data = structure_text_with_gemini(combined_raw_text, "Combined Patient Records")

    # --- Step C: Write the final consolidated result ---
    with open(output_file, "w", encoding="utf-8") as master_file:
        master_file.write(structured_data)

    print(f"\nSuccess! Consolidated data saved to: '{output_file}'")

    # Check if file exists and has content before downloading
    #if os.path.exists(output_file) and os.path.getsize(output_file) > 0:
    #    files.download(output_file)

if __name__ == "__main__":
    main()