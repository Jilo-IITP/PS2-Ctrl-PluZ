from src.retrieval.retriever import HybridRetriever
from src.retrieval.reranker import DocumentReRanker
from typing import Dict, Any


class RetrievalPipeline:

    def __init__(self):
        self.retriever = HybridRetriever()
        self.reranker = DocumentReRanker()

    def retrieve(
        self,
        query: str,
        strategy: str = "hybrid",
        apply_reranking: bool = True
    ) -> Dict[str, Any]:

        trace = {
            "query": query,
            "strategy": strategy,
            "raw_results": [],
            "reranked_results": [],
            "final_chunks": []
        }

        # -------- Base Retrieval --------

        if strategy == "vector":
            trace["raw_results"] = self.retriever.vector_search(query, top_k=15)

        elif strategy == "keyword":
            trace["raw_results"] = self.retriever.keyword_search(query, top_k=15)

        elif strategy == "hybrid":
            trace["raw_results"] = self.retriever.hybrid_search(query, top_k=15)

        else:
            raise ValueError(
                "Invalid strategy. Use 'vector', 'keyword', or 'hybrid'."
            )

        # -------- Optional Re-Ranking --------

        if apply_reranking and trace["raw_results"]:

            trace["reranked_results"] = self.reranker.rerank(
                query=query,
                chunks=trace["raw_results"],
                top_k=5
            )

            trace["final_chunks"] = trace["reranked_results"]

        else:
            trace["final_chunks"] = trace["raw_results"][:5]

        return trace