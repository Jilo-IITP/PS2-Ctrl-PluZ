import os
import psycopg2
from dotenv import load_dotenv

# Load credentials from config/.env
load_dotenv(dotenv_path="config/.env")

def get_db_connection():
    """Establish a connection to the PostgreSQL container."""
    return psycopg2.connect(
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        dbname=os.getenv("DB_NAME")
    )
    
print(os.getenv("DB_PASSWORD"))

def initialize_database():
    """Execute the schema creation."""
    print("Connecting to pgvector container...")
    
    # The 'with' block automatically handles committing transactions and closing the connection
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            
            print("1. Enabling pgvector extension...")
            cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")

            print("2. Creating 'documents' table...")
            cur.execute("""
                CREATE TABLE IF NOT EXISTS documents (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    title VARCHAR(255) NOT NULL,
                    source_type VARCHAR(50) NOT NULL,
                    source_url TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            """)

            print("3. Creating 'chunks' table...")
            # Note: We use 768 dimensions here. Adjust if your embedding model differs.
            cur.execute("""
                CREATE TABLE IF NOT EXISTS chunks (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
                    chunk_index INTEGER NOT NULL,
                    content TEXT NOT NULL,
                    metadata JSONB,
                    embedding vector(768)
                );
            """)

            print("4. Building HNSW Index for rapid similarity search...")
            # We wrap this in a try-except because 'CREATE INDEX IF NOT EXISTS' 
            # behaves slightly differently depending on the Postgres version.
            try:
                cur.execute("""
                    CREATE INDEX IF NOT EXISTS chunks_embedding_hnsw_idx 
                    ON chunks USING hnsw (embedding vector_cosine_ops);
                """)
            except Exception as e:
                print(f"Index might already exist or encountered an error: {e}")

    print("Database initialization complete. Schema is ready for ingestion.")

if __name__ == "__main__":
    initialize_database()