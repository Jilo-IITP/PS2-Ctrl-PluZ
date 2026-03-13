import os
from dotenv import load_dotenv
from src.retrieval.pipeline import RetrievalPipeline

# Load database credentials
load_dotenv(dotenv_path="config/.env")

class StandaloneRetriever:
    def __init__(self):
        print("Initializing Veritas Retrieval Engine (BGE Models loading)...")
        self.pipeline = RetrievalPipeline()
        print("Engine Ready.\n")

    def search(self, query: str, top_k: int = 5) -> list[dict]:
        """
        Executes the hybrid search + cross-encoder re-ranking
        and returns purely the raw chunk dictionaries.
        """
        # The pipeline handles the Vector + BM25 + RRF + Reranker math
        trace = self.pipeline.retrieve(
            query=query, 
            strategy="hybrid", 
            apply_reranking=True
        )
        
        # We bypass the LLM and just return the raw data
        final_chunks = trace.get("final_chunks", [])[:top_k]
        return final_chunks

if __name__ == "__main__":
    # Initialize the standalone engine
    retriever = StandaloneRetriever()
    
    # Run your query
    test_query = "What is the role of the Multi-Head Attention mechanism?"
    print(f"Searching database for: '{test_query}'...\n")
    
    # Get the raw dictionaries
    retrieved_data = retriever.search(query=test_query, top_k=3)
    
    # Print the output to verify
    for i, chunk in enumerate(retrieved_data):
        score = chunk.get('cross_encoder_score', chunk.get('score', 'N/A'))
        section = chunk.get('metadata', {}).get('section', 'Unknown Section')
        
        print(f"--- Result {i+1} [Score: {score}] ---")
        print(f"Path: {section}")
        print(f"Content: {chunk['content']}\n")