# Veritas AI: Enterprise-Grade Hybrid RAG Engine

Veritas AI is a production-ready Retrieval-Augmented Generation (RAG) pipeline architected for high-fidelity, hallucination-resistant knowledge extraction. 

Unlike basic vector-search prototypes, this system is designed with enterprise LLMOps principles: it features a unified database architecture (eliminating the vector/metadata split-brain problem), parallel hybrid retrieval, cross-encoder re-ranking, and strict citation grounding. It is continuously evaluated using the RAGAS framework.

---

## 🏗 System Architecture

```text
[ Raw Data (PDF/Web) ] --> [ Parsing & Chunking (PyMuPDF/BS4) ]
                                        |
                                        v
[ HuggingFace BGE-base ] <--> [ Vectorization & Metadata Tagging ]
                                        |
                                        v
                              [ PostgreSQL + pgvector ]
                              (Relational + HNSW Index)
                                        |
[ User Query ] ----------------> [ Parallel Retrieval ]
                                   /              \
                      [ Dense Vector Search ]  [ Sparse BM25 (FTS) ]
                                   \              /
                                    v            v
                            [ Reciprocal Rank Fusion (RRF) ]
                                        |
                                        v
                          [ Cross-Encoder Re-ranking (Top K) ]
                                        |
                                        v
                      [ Context Assembly & Versioned Prompt ]
                                        |
                                        v
                             [ Gemini 2.5 Flash LLM ]
                                        |
                                        v
                        [ Grounded Response + Citations ]
```

---

## 🚀 Core Technical Features

### Unified Storage Architecture
Utilizes PostgreSQL with the `pgvector` extension and HNSW indexing. This ensures full ACID compliance, keeping dense vectors and flexible JSONB metadata perfectly synced without the overhead of maintaining a separate standalone vector database.

### Layout-Aware Ingestion
Bypasses naive character splitting. Uses `pymupdf4llm` to convert PDFs to Markdown, enabling semantic chunking that preserves header hierarchies and tabular data. Web scraping is handled via targeted BeautifulSoup parsing.

### Advanced Hybrid Retrieval
Executes parallel searches using **Dense Vector Similarity** (via BAAI/bge-base-en-v1.5) and **Sparse Keyword Matching** (via PostgreSQL Full-Text Search). Results are mathematically merged using **Reciprocal Rank Fusion (RRF)**.

### Cross-Encoder Re-ranking
Optimizes the LLM context window by passing the merged RRF results through a Cross-Encoder (BAAI/bge-reranker-base), filtering down to the absolute highest-signal chunks.

### Strict Grounding & Traceability
Prompts are version-controlled via YAML. The LLM is strictly instructed to append deterministic citations (e.g., `[Source: URL or File Path]`) and gracefully deny answers if context is insufficient.

### LLMOps & Evaluation
Integrated with the RAGAS framework. The pipeline is continuously tested against a Golden Dataset of 100 QnA pairs using an LLM-as-a-judge approach to quantify context precision and faithfulness.

---

## 🛠 Technology Stack

| Component | Technology |
|-----------|------------|
| **Language** | Python 3.13+ |
| **Package Management** | uv (Astral) |
| **Database** | PostgreSQL (pgvector via Docker) |
| **Embeddings** | HuggingFace BAAI/bge-base-en-v1.5 (Local) |
| **Re-ranker** | HuggingFace BAAI/bge-reranker-base (Local) |
| **Generation & Evaluation LLM** | Google Gemini 2.5 Flash |
| **Frameworks** | LangChain, Ragas, PyMuPDF, BeautifulSoup4 |

---

## 📊 Evaluation Metrics (Proof of Work)

Evaluated against a 100-pair Golden Dataset using Ragas.

| Metric | Score | Description |
|--------|-------|-------------|
| **Faithfulness** | 0.91 | Measures if the LLM hallucinated outside the retrieved context. |
| **Answer Relevancy** | 0.95 | Measures how directly the response addresses the user's query. |
| **Context Precision** | 0.687 | Measures the accuracy of the retriever and cross-encoder sorting. |


---

## ⚙️ Local Setup & Installation

### 1. Clone the repository and initialize the environment

```bash
git clone https://github.com/yourusername/veritas-ai.git
cd veritas-ai
uv venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
uv sync
```

### 2. Configure Environment Variables

Create a `.env` file in the `config/` directory:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=admin
DB_PASSWORD=your_secure_password
DB_NAME=veritas_rag
GOOGLE_API_KEY=your_gemini_api_key
```

### 3. Spin up the Database

```bash
docker compose up -d
uv run python src/database/db_init.py
```

### 4. Run the End-to-End Pipeline

```bash
# Ingest test data
uv run python test_pdf_ingestion.py

# Query the engine
uv run python app.py

# Run evaluation
uv run python evaluate.py
```

---
