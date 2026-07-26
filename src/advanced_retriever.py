from rank_bm25 import BM25Okapi
from sentence_transformers import CrossEncoder
from collections import defaultdict
import numpy as np


class AdvancedRetriever:

    def __init__(self, vectorstore):

        self.vectorstore = vectorstore

        self.reranker = CrossEncoder(
            "cross-encoder/ms-marco-MiniLM-L-6-v2"
        )

        self.documents = [
            meta["text"]
            for meta in self.vectorstore.metadata
        ]

        self.tokenized_docs = [
            doc.lower().split()
            for doc in self.documents
        ]

        self.bm25 = BM25Okapi(
            self.tokenized_docs
        )

    #################################################
    # BM25 SEARCH (Sparse Retrieval)
    #################################################

    def bm25_search(
        self,
        query,
        top_k=20
    ):
        print("BM25 Running...")
        scores = self.bm25.get_scores(
            query.lower().split()
        )

        indices = np.argsort(scores)[::-1][:top_k]

        results = []

        for idx in indices:

            results.append(
                {
                    "index": idx,
                    "score": float(scores[idx]),
                    "metadata":
                        self.vectorstore.metadata[idx]
                }
            )

        return results

    #################################################
    # DENSE SEARCH (FAISS)
    #################################################

    def dense_search(
        self,
        query,
        top_k=20
    ):

        return self.vectorstore.query(
            query,
            top_k=top_k
        )

    #################################################
    # RRF FUSION (Reciprocal Rank Fusion)
    #################################################

    def reciprocal_rank_fusion(
        self,
        dense_results,
        sparse_results,
        k=60
    ):
        print("RRF Running...")
        scores = defaultdict(float)

        for rank, doc in enumerate(dense_results):

            idx = doc["index"]

            scores[idx] += 1 / (k + rank)

        for rank, doc in enumerate(sparse_results):

            idx = doc["index"]

            scores[idx] += 1 / (k + rank)

        ranked = sorted(
            scores.items(),
            key=lambda x: x[1],
            reverse=True
        )

        results = []

        for idx, score in ranked:

            results.append(
                {
                    "index": idx,
                    "score": score,
                    "metadata":
                        self.vectorstore.metadata[idx]
                }
            )

        return results

    #################################################
    # RERANK with Cross-Encoder
    #################################################

    def rerank(
        self,
        query,
        docs,
        top_k=5
    ):
        print("Cross Encoder Reranking...")
        pairs = []

        for doc in docs:

            pairs.append(
                [
                    query,
                    doc["metadata"]["text"]
                ]
            )

        scores = self.reranker.predict(
            pairs
        )

        ranked = sorted(
            zip(scores, docs),
            key=lambda x: x[0],
            reverse=True
        )

        return [
            doc
            for score, doc
            in ranked[:top_k]
        ]

    #################################################
    # FINAL RETRIEVE (End-to-end)
    #################################################

    def retrieve(
        self,
        query,
        retrieve_k=20,
        final_k=5
    ):

        dense_results = self.dense_search(
            query,
            retrieve_k
        )

        sparse_results = self.bm25_search(
            query,
            retrieve_k
        )

        fused_results = self.reciprocal_rank_fusion(
            dense_results,
            sparse_results
        )

        final_results = self.rerank(
            query,
            fused_results,
            final_k
        )

        return final_results