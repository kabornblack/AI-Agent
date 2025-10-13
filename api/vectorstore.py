# api/vectorstore.py
from chromadb import Client
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
import os

# Initialize local ChromaDB
chroma_client = Client(Settings(
    persist_directory="./demo_data/vector_store"
))

# Embedding model
embedder = SentenceTransformer("all-MiniLM-L6-v2")

def create_collection(collection_name="wise_docs"):
    return chroma_client.get_or_create_collection(name=collection_name)

def add_documents(collection_name, documents):
    collection = create_collection(collection_name)
    embeddings = embedder.encode(documents)
    ids = [f"doc_{i}" for i in range(len(documents))]
    collection.add(documents=documents, embeddings=embeddings, ids=ids)

def query_collection(query, collection_name="wise_docs", top_k=3):
    collection = create_collection(collection_name)
    query_emb = embedder.encode([query])
    results = collection.query(query_embeddings=query_emb, n_results=top_k)
    return results
