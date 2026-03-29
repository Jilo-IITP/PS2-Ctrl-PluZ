import os
import json
import concurrent.futures
from langchain_google_genai import ChatGoogleGenerativeAI
from get_chunks import StandaloneRetriever

from dotenv import load_dotenv, find_dotenv; load_dotenv(find_dotenv())

# Support both GOOGLE_API_KEY and GEMINI_API_KEY
if "GOOGLE_API_KEY" not in os.environ and "GEMINI_API_KEY" in os.environ:
    os.environ["GOOGLE_API_KEY"] = os.environ["GEMINI_API_KEY"]

if "GOOGLE_API_KEY" not in os.environ:
    raise ValueError("GOOGLE_API_KEY or GEMINI_API_KEY environment variable not set.")

def extract_diagnoses(ocr_text: str) -> list[str]:
    print("-> Pinging Gemini 2.5 Flash for NER extraction...")
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0)
    
    prompt = f"""
    You are a Clinical Data Extraction Engine. Analyze the provided hospital document OCR text.
    Locate the "Diagnosis", "Chief Complaints", or "Description" sections.
    Extract ONLY the distinct medical conditions, symptoms, or diagnoses. 
    Ignore medications, billing items, lab test names, and patient info.
    If the text says "No specific diagnosis found" or only lists preventative checkups, return an empty list.
    
    CRITICAL: Translate colloquial symptoms into standard clinical terminology short description precise so that it closely matches the ICD-10 vocabulary before outputting (e.g., convert "Cold" to "Acute nasopharyngitis").
    
    Output strictly as a JSON list of strings. Do not include markdown formatting like ```json.
    
    OCR Text:
    {ocr_text}
    """
    
    response = llm.invoke(prompt)
    try:
        clean_json = response.content.replace("```json", "").replace("```", "").strip()
        return json.loads(clean_json)
    except json.JSONDecodeError:
        print("Failed to parse LLM output. Returning empty list.")
        return []

def fetch_top_2_chunks(entities: list[str]) -> dict:
    print(f"-> Fanning out parallel database searches for {len(entities)} entities...")
    retriever = StandaloneRetriever()
    results_map = {}

    def fetch_single(entity):
        # Fetch using hybrid search and MedCPT cross-encoder, grab exactly top 2
        chunks = retriever.search(query=entity, top_k=3)
        return entity, chunks[:2]

    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        future_to_entity = {executor.submit(fetch_single, ent): ent for ent in entities}
        for future in concurrent.futures.as_completed(future_to_entity):
            entity, top_chunks = future.result()
            results_map[entity] = top_chunks
            
    return results_map

def write_handoff_file(mapped_contexts: dict, output_filename: str):
    print(f"-> Writing Top-2 contexts to {output_filename}...")
    with open(output_filename, "w", encoding="utf-8") as f:
        f.write("=== VERITAS AI: NORMALIZED CLINICAL CONTEXT ===\n\n")
        
        if not mapped_contexts:
            f.write("No valid clinical diagnoses found in source document.\n")
            return
            
        for entity, chunks in mapped_contexts.items():
            f.write(f"Source Entity: {entity}\n")
            f.write("-" * 50 + "\n")
            
            if not chunks:
                f.write("  [NO DATABASE MATCH FOUND]\n\n")
                continue
                
            for i, chunk in enumerate(chunks):
                meta = chunk.get("metadata", {})
                icd_code = meta.get('parent_code', 'UNKNOWN')
                disease = meta.get('disease_family', 'UNKNOWN')
                score = chunk.get('cross_encoder_score', chunk.get('score', 'N/A'))
                
                # Format score to 4 decimal places if it's a float
                if isinstance(score, float):
                    score = f"{score:.4f}"
                
                text_content = chunk.get('text', '').replace('\n', ' ')
                f.write(f"  Result {i+1} [ICD: {icd_code} | Score: {score}]: {disease}\n")
                f.write(f"  Context: {text_content}\n\n")
            f.write("\n")

def generate_handoff_text(mapped_contexts: dict) -> str:
    print("-> Generating Top-2 contexts in memory...")
    lines = ["=== VERITAS AI: NORMALIZED CLINICAL CONTEXT ===\n\n"]
    
    if not mapped_contexts:
        lines.append("No valid clinical diagnoses found in source document.\n")
        return "".join(lines)
        
    for entity, chunks in mapped_contexts.items():
        lines.append(f"Source Entity: {entity}\n")
        lines.append("-" * 50 + "\n")
        
        if not chunks:
            lines.append("  [NO DATABASE MATCH FOUND]\n\n")
            continue
            
        for i, chunk in enumerate(chunks):
            meta = chunk.get("metadata", {})
            icd_code = meta.get('parent_code', 'UNKNOWN')
            disease = meta.get('disease_family', 'UNKNOWN')
            score = chunk.get('cross_encoder_score', chunk.get('score', 'N/A'))
            
            if isinstance(score, float):
                score = f"{score:.4f}"
            
            text_content = chunk.get('text', '').replace('\n', ' ')
            lines.append(f"  Result {i+1} [ICD: {icd_code} | Score: {score}]: {disease}\n")
            lines.append(f"  Context: {text_content}\n\n")
        lines.append("\n")
    return "".join(lines)

def run_retrieval_pipeline(ocr_text: str) -> str:
    """End-to-end memory pipeline for retrieval."""
    diagnoses = extract_diagnoses(ocr_text)
    print(f"Isolated Entities: {diagnoses}")
    
    if diagnoses:
        context_map = fetch_top_2_chunks(diagnoses)
    else:
        context_map = {}
        
    return generate_handoff_text(context_map)

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    input_file = os.path.join(script_dir, "data_from_preprocessing", "structured_hospital_data.txt")
    output_file = os.path.join(script_dir, "..", "data", "input", "reti_output.txt")
    
    # Read the OCR text
    with open(input_file, "r", encoding="utf-8") as f:
        raw_text = f.read()
        
    # 1. Extract
    diagnoses = extract_diagnoses(raw_text)
    print(f"Isolated Entities: {diagnoses}")
    
    # 2. Retrieve
    if diagnoses:
        context_map = fetch_top_2_chunks(diagnoses)
    else:
        context_map = {}
        
    # 3. Write
    write_handoff_file(context_map, output_file)
    print("-> Pipeline Complete. File is ready.")