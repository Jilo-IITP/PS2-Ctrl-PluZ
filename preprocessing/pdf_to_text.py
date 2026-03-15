
import os
import easyocr
import google.generativeai as genai
from pdf2image import convert_from_path
from dotenv import load_dotenv , find_dotenv

#keys in secrets tab

load_dotenv(find_dotenv()) 

api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)
#ocr model
reader = easyocr.Reader(['en'])
#gemini model
model = genai.GenerativeModel('models/gemini-2.5-flash')

def process_single_pdf(pdf_path):
    """Converts PDF to text using EasyOCR."""
    print(f"--- Extracting text from: {os.path.basename(pdf_path)} ---")

    try:
        images = convert_from_path(pdf_path)
    except Exception as e:
        return f"Error reading PDF: {e}"

    raw_text = ""
    for i, image in enumerate(images):
        temp_img = f"temp_page_{i}.jpg"
        image.save(temp_img)

        # Run EasyOCR
        result = reader.readtext(temp_img, detail=0)
        if result:
            raw_text += " ".join(result) + " "

        os.remove(temp_img)
    return raw_text

def structure_text_with_gemini(raw_text, filename):
    """Sends messy text to Gemini for cleaning and structuring."""
    prompt = f"""
    The following text is from a hospital document named '{filename}'.
    It is unstructured OCR output. Please:
    1. Clean it up (fix typos, remove page numbers and hospital headers).
    2. Structure it into sections: [Patient Info, Billing/Charges, Medications, Diagnosis].
    3. Use Markdown tables for any billing items or test result lists.

    RAW TEXT:
    {raw_text}
    """
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Gemini API Error: {e}"

def run_pdf_pipeline(pdf_path: str, filename: str) -> str:
    """Orchestrates the PDF processing directly from early stages without hitting disk for output."""
    raw_content = process_single_pdf(pdf_path)
    structured_data = structure_text_with_gemini(raw_content, filename)
    return structured_data

def main():
    input_folder = "hospital_pdfs"
    # POINT THIS TO YOUR FRIEND'S RETRIEVAL DATA FOLDER
    output_folder = "../retrieval/data_from_preprocessing" 
    output_file = os.path.join(output_folder, "structured_hospital_data.txt")
    #output_file = "structured_hospital_data.txt"

    if not os.path.exists(input_folder):
        os.makedirs(input_folder)
        print(f"Created folder '{input_folder}'. Please upload your PDFs inside it and run again.")
        return

    pdf_files = [f for f in os.listdir(input_folder) if f.lower().endswith(".pdf")]

    if not pdf_files:
        print(f"No PDF files found in '{input_folder}'. Upload them to the sidebar folder.")
        return

    with open(output_file, "w", encoding="utf-8") as master_file:
        for filename in pdf_files:
            pdf_path = os.path.join(input_folder, filename)

            # Step A: OCR Extraction
            raw_content = process_single_pdf(pdf_path)

            # Step B: LLM Structuring
            print(f"Structuring {filename} with Gemini...")
            structured_data = structure_text_with_gemini(raw_content, filename)

            # Step C: Write to the master text file
            # Step C: Total Clean Version
            master_file.write(structured_data + "\n\n")

    print(f"\nSuccess! Data synced to retrieval folder: '{output_file}'")

    # Check if file exists and has content before downloading
    #if os.path.exists(output_file) and os.path.getsize(output_file) > 0:
    #    files.download(output_file)

if __name__ == "__main__":
    main()