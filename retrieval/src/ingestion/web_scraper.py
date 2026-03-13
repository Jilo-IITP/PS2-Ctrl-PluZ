import requests
from bs4 import BeautifulSoup
from typing import List, Dict
from langchain_text_splitters import RecursiveCharacterTextSplitter

class DocumentProcessor:
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 100):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def fetch_and_clean_html(self, url: str) -> str:
        """
        Fetch a webpage and return cleaned textual content suitable for RAG.

        Steps:
        1. Fetch page using requests with proper headers
        2. Parse HTML using BeautifulSoup
        3. Remove non-content elements
        4. Extract meaningful text
        5. Normalize whitespace

        Args:
            url (str): URL of the webpage

        Returns:
            str: Cleaned text content
        """

        headers = {
            "User-Agent": "AyushmanBot/1.0 (https://ayushman404.me; ayushman9905000@gmail.com)"
        }

        try:
            response = requests.get(url, headers=headers, timeout=15)
            response.raise_for_status()
        except requests.RequestException as e:
            raise RuntimeError(f"Failed to fetch URL: {url}") from e

        soup = BeautifulSoup(response.text, "html.parser")

        # Remove noisy elements
        for tag in soup(["script", "style", "nav", "footer", "header", "aside", "noscript"]):
            tag.decompose()

        # Extract text
        text = soup.get_text(separator=" ")

        # Normalize whitespace
        cleaned_text = " ".join(text.split())

        return cleaned_text

    def chunk_text(self, text: str) -> List[str]:
        """
        Split text into overlapping chunks suitable for RAG retrieval.

        Strategy:
        - Use RecursiveCharacterTextSplitter to preserve semantic structure.
        - Respect configured chunk_size and chunk_overlap.
        - Prefer paragraph → sentence → word → character splitting.

        Returns:
            List[str]: List of text chunks ready for embedding.
        """

        if not text or not text.strip():
            return []

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap,
            length_function=len,
            separators=[
                "\n\n",   # paragraph
                "\n",     # line
                ". ",     # sentence
                " ",      # word
                ""        # fallback char split
            ],
        )

        chunks = splitter.split_text(text)

        # Final normalization
        cleaned_chunks = [chunk.strip() for chunk in chunks if chunk.strip()]

        return cleaned_chunks
        

    def process_url(self, url: str, title: str) -> List[Dict]:
        """
        Orchestrates the ingestion pipeline for a URL.

        Steps:
        1. Fetch and clean the webpage text.
        2. Split the text into chunks.
        3. Package each chunk with metadata.
        4. Return structured documents ready for embedding/vector storage.
        """

        # Step 1: Fetch and clean text
        cleaned_text = self.fetch_and_clean_html(url)

        if not cleaned_text:
            return []

        # Step 2: Chunk the text
        chunks = self.chunk_text(cleaned_text)

        # Step 3: Package chunks
        packaged_chunks: List[Dict] = []

        for idx, chunk in enumerate(chunks):
            packaged_chunks.append({
                "text": chunk,
                "chunk_index": idx,
                "metadata": {
                    "url": url,
                    "title": title
                }
            })

        return packaged_chunks