# api/ingest_demo.py
from api.vectorstore import add_documents
import os

def ingest_demo_docs():
    file_path = "demo_data/sample_kb.txt"
    if not os.path.exists(file_path):
        print("❌ sample_kb.txt not found! Please create it in demo_data/")
        return
    with open(file_path, "r", encoding="utf-8") as f:
        text = f.read()
    docs = [chunk.strip() for chunk in text.split("\n") if chunk.strip()]
    add_documents("wise_docs", docs)
    print("✅ Demo documents ingested successfully!")

if __name__ == "__main__":
    ingest_demo_docs()
