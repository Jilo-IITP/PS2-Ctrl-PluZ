import psycopg2
import psycopg2.extras
from langchain_huggingface import HuggingFaceEmbeddings
from typing import List, Dict
import os
import json
from dotenv import load_dotenv,find_dotenv

load_dotenv(find_dotenv())

class VectorDBManager:
    def __init__(self):
        # Initialize the local embedding model
        # BGE-base outputs 768 dimensions, matching our schema
        self.embeddings = HuggingFaceEmbeddings(
            model_name="NeuML/pubmedbert-base-embeddings",
            model_kwargs={'device': 'cpu'}, # Change to 'cuda' if you have a local GPU
            encode_kwargs={'normalize_embeddings': True} # Crucial for cosine similarity
        )
        
    def get_connection(self):
        return psycopg2.connect(
            host=os.getenv("DB_HOST"),
            port=os.getenv("DB_PORT"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            dbname=os.getenv("DB_NAME"),
            sslmode='require'
        )

    def insert_document(self, title: str, source_type: str, source_url: str) -> str:
        """
        Insert a document into the documents table and return its UUID.
        """

        query = """
            INSERT INTO documents (title, source_type, source_url)
            VALUES (%s, %s, %s)
            RETURNING id;
        """

        conn = self.get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(query, (title, source_type, source_url))
                document_id = cur.fetchone()[0]
            conn.commit()
            return document_id
        finally:
            conn.close()

    def insert_chunks(self, document_id: str, chunks: List[Dict]):
        """
        Batch insert chunks with embeddings.
        """

        if not chunks:
            return

        conn = self.get_connection()

        try:
            # 1. Extract text for embedding
            texts = [chunk["text"] for chunk in chunks]

            # 2. Generate embeddings
            vectors = self.embeddings.embed_documents(texts)

            # 3. Prepare batch records
            records = []

            for chunk, vector in zip(chunks, vectors):
                records.append(
                    (
                        document_id,
                        chunk["chunk_index"],
                        chunk["text"],
                        json.dumps(chunk.get("metadata", {})),
                        vector
                    )
                )

            # 4. Batch insert
            query = """
                INSERT INTO chunks (document_id, chunk_index, content, metadata, embedding)
                VALUES %s
            """

            with conn.cursor() as cur:
                psycopg2.extras.execute_values(
                    cur,
                    query,
                    records,
                    template="(%s, %s, %s, %s, %s)"
                )

            # 5. Commit
            conn.commit()

        finally:
            conn.close()