import pymupdf4llm
from langchain_text_splitters import MarkdownHeaderTextSplitter, RecursiveCharacterTextSplitter
from typing import List, Dict
import os


class PDFProcessor:
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 100):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

        # Header structure for semantic splitting
        self.headers_to_split_on = [
            ("#", "Header 1"),
            ("##", "Header 2"),
            ("###", "Header 3"),
        ]

        self.markdown_splitter = MarkdownHeaderTextSplitter(
            headers_to_split_on=self.headers_to_split_on
        )

        # Fallback splitter for oversized sections
        self.fallback_splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap,
        )

    def extract_markdown_from_pdf(self, file_path: str) -> str:
        """
        1. Validate file exists
        2. Extract layout-aware markdown from PDF
        3. Return markdown string
        """

        if not os.path.exists(file_path):
            raise FileNotFoundError(f"PDF not found: {file_path}")

        try:
            md_text = pymupdf4llm.to_markdown(file_path)
        except Exception as e:
            raise RuntimeError(f"Failed to extract markdown from PDF: {file_path}") from e

        if not md_text or not md_text.strip():
            raise ValueError("Extracted markdown is empty")

        return md_text

    def chunk_markdown(self, md_text: str) -> List[Dict]:
        """
        1. Split markdown based on headers
        2. Apply fallback splitter if chunk is too large
        3. Return list of chunk objects
        """

        header_chunks = self.markdown_splitter.split_text(md_text)

        final_chunks = []

        for chunk in header_chunks:
            text = chunk.page_content
            metadata = chunk.metadata

            # If chunk is small enough, keep it
            if len(text) <= self.chunk_size:
                final_chunks.append({
                    "text": text.strip(),
                    "metadata": metadata
                })
                continue

            # Otherwise apply recursive splitter
            sub_chunks = self.fallback_splitter.split_text(text)

            for sub_chunk in sub_chunks:
                final_chunks.append({
                    "text": sub_chunk.strip(),
                    "metadata": metadata
                })

        return final_chunks

    def process_pdf(self, file_path: str, title: str) -> list[dict]:
        """
        Extracts, chunks, and standardizes metadata for the database.
        """
        md_text = self.extract_markdown_from_pdf(file_path)
        
        # Assuming your chunk_markdown method returns LangChain Document objects
        raw_documents = self.chunk_markdown(md_text) 
        
        final_chunks = []
        for i, doc in enumerate(raw_documents):
            meta = doc['metadata'].copy()
            
            # Inject universal tracking data
            meta['file_path'] = file_path
            meta['title'] = title
            
            # Combine Markdown headers into a readable citation path (e.g., "Abstract > Model Architecture")
            headers = [str(val) for key, val in meta.items() if 'Header' in key]
            meta['section'] = " > ".join(headers) if headers else "General"
            
            final_chunks.append({
                'text': doc["text"], # LangChain stores text here
                'chunk_index': i,
                'metadata': meta
            })
            
        return final_chunks
    
    