import os
from src.ingestion.pdf_parser import PDFProcessor
from src.database.db_manager import VectorDBManager

def run_pdf_integration():
    print("1. Initializing DB Manager & PDF Parser...")
    db_manager = VectorDBManager()
    pdf_processor = PDFProcessor(chunk_size=1000, chunk_overlap=100)
    
    file_path = "data/icd10cm_tabular_2026.pdf"
    title = "Attention Is All You Need"
    
    if not os.path.exists(file_path):
        print(f"Error: Could not find {file_path}. Please create the /data folder and add the PDF.")
        return

    print(f"\n2. Extracting and chunking data from: {file_path}")
    chunks = pdf_processor.process_pdf(file_path, title)
    
    if not chunks:
        print("Error: PDF Processor returned 0 chunks.")
        return

    print(f"Success! Generated {len(chunks)} chunks with Markdown metadata.")
    
    print("\n3. Pushing to pgvector database...")
    try:
        doc_id = db_manager.insert_document(title, "pdf", file_path)
        print(f"Created Document record with UUID: {doc_id}")
        
        db_manager.insert_chunks(doc_id, chunks)
        print("\nPDF Integration Test Complete! Data successfully embedded and stored.")
        
    except Exception as e:
        print(f"\nDatabase insertion failed: {e}")

if __name__ == "__main__":
    run_pdf_integration()