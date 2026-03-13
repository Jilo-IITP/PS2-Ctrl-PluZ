from sentence_transformers import CrossEncoder
from typing import List, Dict


class DocumentReRanker:
    def __init__(self):
        # Cross-encoder reads query and document together
        self.model = CrossEncoder(
            "BAAI/bge-reranker-base",
            max_length=512
        )

    def rerank(self, query: str, chunks: List[Dict], top_k: int = 5) -> List[Dict]:
        """
        Re-rank retrieved chunks using a cross-encoder model.
        """

        if not chunks:
            return []

        # 1. Create (query, document) pairs
        pairs = []
        for chunk in chunks:
            text = chunk.get("text") or chunk.get("content")
            pairs.append([query, text])

        # 2. Predict relevance scores
        scores = self.model.predict(pairs)

        # 3. Attach scores to chunk objects
        for chunk, score in zip(chunks, scores):
            chunk["cross_encoder_score"] = float(score)

        # 4. Sort by score descending
        reranked = sorted(
            chunks,
            key=lambda x: x["cross_encoder_score"],
            reverse=True
        )

        # 5. Return top_k
        return reranked[:top_k]