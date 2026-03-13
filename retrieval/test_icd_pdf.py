from tqdm import tqdm
from src.ingestion.pdf_parser import PDFProcessor
from src.database.db_manager import VectorDBManager
import re
import os
from langchain_text_splitters import RecursiveCharacterTextSplitter

def parse_icd_structure(raw_text: str) -> list[dict]:
    # Looks for optional asterisks/spaces, exactly 3 chars (e.g., A07), a space, then the title
    parent_pattern = re.compile(r'^[\*\s]*([A-Z][0-9]{2})\s+(.*)$')
    
    chunks = []
    current_chunk_lines = []
    current_code = None
    current_name = None
    chunk_counter = 0

    for line in raw_text.split('\n'):
        line = line.strip()
        if not line:
            continue
            
        match = parent_pattern.match(line)
        
        if match:
            # We hit a new parent code (e.g., **A08 Viral...**)
            if current_code and current_chunk_lines:
                chunks.append({
                    "text": "\n".join(current_chunk_lines),
                    "chunk_index": chunk_counter,
                    "metadata": {
                        "parent_code": current_code,
                        "disease_family": current_name
                    }
                })
                chunk_counter += 1
            
            # Open the new bucket
            current_code = match.group(1)
            # Strip the trailing asterisks from the title for clean metadata
            current_name = match.group(2).replace("*", "").strip()
            current_chunk_lines = [line]
            
        else:
            # It's a sub-code (A07.0) or description. Dump it in the current bucket.
            if current_code:
                current_chunk_lines.append(line)

    # Append the final bucket
    if current_code and current_chunk_lines:
        chunks.append({
            "text": "\n".join(current_chunk_lines),
            "chunk_index": chunk_counter,
            "metadata": {
                "parent_code": current_code,
                "disease_family": current_name
            }
        })

    return chunks



def generate_clinical_sub_chunks(raw_text: str) -> list[dict]:
    # 1. Run your existing regex parser to get the major disease families
    parent_buckets = parse_icd_structure(raw_text)
    
    # 2. Initialize a tight, uniform text splitter
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=300,       # Short, dense blocks
        chunk_overlap=50,     # Enough overlap so sentences don't break blindly
        separators=["\n\n", "\n", " ", ""]
    )
    
    final_micro_chunks = []
    global_chunk_index = 0
    
    # 3. Chop the buckets and stamp the metadata
    for bucket in parent_buckets:
        parent_text = bucket["text"]
        parent_meta = bucket["metadata"]
        
        # Split the large bucket into tiny strings
        micro_texts = text_splitter.split_text(parent_text)
        
        for text in micro_texts:
            final_micro_chunks.append({
                "text": text,
                "chunk_index": global_chunk_index,
                "metadata": {
                    "domain": "ICD", # The critical tag for future CPT filtering
                    "parent_code": parent_meta["parent_code"],
                    "disease_family": parent_meta["disease_family"]
                }
            })
            global_chunk_index += 1
            
    return final_micro_chunks








def run_icd_pdf_integration():
    file_path = "data/icd10cm_tabular_2026.pdf"
    title = "ICD-10 Clinical Codes"

    # 1. Initialize your existing modules
    pdf_processor = PDFProcessor()
    db_manager = VectorDBManager()

    print(f"1. Extracting raw text from PDF: {file_path} (This might take a minute)...")
    
    # Define your cache path
    cache_file = "data/icd_10_master_extracted.txt"

    if os.path.exists(cache_file):
        print("Found cached text file! Bypassing 2500-page PDF extraction...")
        with open(cache_file, "r", encoding="utf-8") as f:
            raw_pdf_text = f.read()
    else:
        print("No cache found. Extracting 2500 pages (Go grab a coffee)...")
        raw_pdf_text = pdf_processor.extract_markdown_from_pdf(file_path)
        
        print("Extraction complete! Saving to cache for future runs...")
        with open(cache_file, "w", encoding="utf-8") as f:
            f.write(raw_pdf_text)
            
    
    print("\n2. Running Custom Structural Regex Parser...")
    # Feed the raw text directly into your new parser
    all_chunks = generate_clinical_sub_chunks(raw_pdf_text)
    total_chunks = len(all_chunks)
    print(f"Successfully isolated {total_chunks} disease families.")

    print("\n3. Pushing to pgvector database in batches...")
    try:
        # Create the parent document
        doc_id = db_manager.insert_document(title, "txt", cache_file)
        
        # The Batching Engine
        BATCH_SIZE = 100 
        for i in tqdm(range(0, total_chunks, BATCH_SIZE)):
            batch = all_chunks[i : i + BATCH_SIZE]
            
            db_manager.insert_chunks(doc_id, batch)
            
        print("\nClinical Data Ingestion Complete! Ready for querying.")
        
    except Exception as e:
        print(f"\nDatabase insertion failed: {e}")

if __name__ == "__main__":
    run_icd_pdf_integration()