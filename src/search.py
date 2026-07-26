import os
from dotenv import load_dotenv
from src.vector_store import FaissVectorStore
from src.data_loader import load_all_documents
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage
from src.advanced_retriever import AdvancedRetriever

load_dotenv()

class RAGSearch:
    def __init__(self, persist_dir: str = "faiss_store", embedding_model: str = "BAAI/bge-base-en-v1.5", llm_model: str = "llama-3.3-70b-versatile"):
        self.persist_dir = persist_dir
        self.embedding_model = embedding_model
        self.vectorstore = FaissVectorStore(persist_dir, embedding_model)
        self.llm_model = llm_model
        self.llm = None
        self.retriever = None
        self._initialized = False
        print(f"[INFO] RAGSearch instance created (lazy init, persist_dir={persist_dir})")

    def _ensure_initialized(self):
        """Lazy initialization — vector store + LLM loaded on first use"""
        if self._initialized:
            return

        # Load or build vectorstore
        faiss_path = os.path.join(self.persist_dir, "faiss.index")
        meta_path = os.path.join(self.persist_dir, "metadata.pkl")
        exists = os.path.exists(faiss_path) and os.path.exists(meta_path)

        if exists:
            loaded = self.vectorstore.load()
            if not loaded:
                print("[INFO] No existing FAISS index, starting fresh")
        else:
            print("[INFO] No prior FAISS index found — user must upload documents")

        # Initialize LLM only if GROQ_API_KEY is set
        groq_api_key = os.getenv("GROQ_API_KEY", "")
        if groq_api_key:
            self.llm = ChatGroq(groq_api_key=groq_api_key, model_name=self.llm_model)
            print(f"[INFO] Groq LLM initialized: {self.llm_model}")
        else:
            print("[WARN] GROQ_API_KEY not set — LLM will not be available")

        # Initialize retriever if metadata exists
        if self.vectorstore.metadata:
            self.retriever = AdvancedRetriever(self.vectorstore)
            print("[INFO] AdvancedRetriever initialized with existing documents")

        self._initialized = True

    def add_documents(self, file_paths):
        """Load files, chunk, embed, and add to vector store at runtime"""
        self._ensure_initialized()

        documents = []
        for fp in file_paths:
            if not os.path.exists(fp):
                print(f"[WARN] File not found: {fp}")
                continue
            # Use data_loader to load the single file
            from src.data_loader import load_all_documents
            # load_all_documents loads from a directory, so we load the parent
            # and filter. Instead, let's support single file loading directly.
            from pathlib import Path
            ext = Path(fp).suffix.lower()
            try:
                if ext == '.pdf':
                    from langchain_community.document_loaders import PyPDFLoader
                    loader = PyPDFLoader(fp)
                elif ext == '.txt':
                    from langchain_community.document_loaders import TextLoader
                    loader = TextLoader(fp)
                elif ext == '.csv':
                    from langchain_community.document_loaders import CSVLoader
                    loader = CSVLoader(fp)
                elif ext == '.docx':
                    from langchain_community.document_loaders import Docx2txtLoader
                    loader = Docx2txtLoader(fp)
                elif ext in ['.xlsx', '.xls']:
                    from langchain_community.document_loaders import UnstructuredExcelLoader
                    loader = UnstructuredExcelLoader(fp)
                elif ext == '.json':
                    from langchain_community.document_loaders import JSONLoader
                    loader = JSONLoader(fp)
                else:
                    print(f"[WARN] Unsupported file type: {ext}")
                    continue
                docs = loader.load()
                documents.extend(docs)
                print(f"[INFO] Loaded {len(docs)} pages from {fp}")
            except Exception as e:
                print(f"[ERROR] Failed to load {fp}: {e}")

        if not documents:
            return 0

        count = self.vectorstore.add_documents(documents)

        # Re-initialize retriever with new metadata
        if self.vectorstore.metadata:
            self.retriever = AdvancedRetriever(self.vectorstore)

        return count

    def search_and_summarize(self, query: str, top_k: int = 20) -> str:
        self._ensure_initialized()

        # If no documents loaded yet, try to auto-load from data directory
        if not self.vectorstore.metadata or self.vectorstore.index.ntotal == 0:
            data_dir = "data"
            if os.path.isdir(data_dir) and any(os.listdir(data_dir)):
                print(f"[INFO] Auto-loading documents from {data_dir}...")
                docs = load_all_documents(data_dir)
                if docs:
                    self.vectorstore.add_documents(docs)
                    if self.vectorstore.metadata:
                        self.retriever = AdvancedRetriever(self.vectorstore)

        # If still no documents
        if not self.vectorstore.metadata or self.vectorstore.index.ntotal == 0:
            return "No documents loaded yet. Please upload documents first using the upload button."

        print("Using Advanced Retriever...")
        results = self.retriever.retrieve(query=query, retrieve_k=20, final_k=5)

        texts = [r["metadata"].get("text", "") for r in results if r["metadata"]]
        context = "\n\n".join(texts)
        if not context:
            return "No relevant documents found."

        if not self.llm:
            return f"[LLM not configured — set GROQ_API_KEY]\n\nRelevant context found:\n\n{context[:2000]}"

        prompt =f"""You are a helpful AI assistant.Answer the question using only the provided context.: '{query}'

                    Context:
                    {context}

                    Summary:"""
        try:
            response = self.llm.invoke([HumanMessage(content=prompt)])
            return response.content
        except BaseException as e:
            # If the LLM call fails (authentication, network, etc.), disable LLM
            # and return a helpful fallback containing the relevant context.
            print(f"[WARN] LLM invocation failed: {e}")
            try:
                from groq import AuthenticationError
                if isinstance(e, AuthenticationError) or 'Invalid API Key' in str(e):
                    print("[WARN] Disabling LLM due to authentication error.")
            except Exception:
                pass
            self.llm = None
            return f"[LLM unavailable — falling back to context]\n\nRelevant context found:\n\n{context[:2000]}"

    def retrieve_documents(self, query):
        self._ensure_initialized()
        if not self.retriever:
            return []
        return self.retriever.retrieve(query=query, retrieve_k=20, final_k=5)

    def get_document_count(self) -> int:
        """Return the number of loaded documents"""
        return self.vectorstore.get_document_count()

# Example usage
if __name__ == "__main__":
    rag_search = RAGSearch()
    # query = "What is attention mechanism?"
    # summary = rag_search.search_and_summarize(query, top_k=5)
    # print("Summary:", summary)
