# api/chunking.py
import math


def chunk_text(text: str, chunk_size=800, overlap=100):
"""Simple whitespace-based chunker. chunk_size and overlap are words.
For production use tokenizers like tiktoken for more accurate control.
"""
words = text.split()
if len(words) <= chunk_size:
return [text]
chunks = []
i = 0
while i < len(words):
chunk_words = words[i:i+chunk_size]
chunks.append(' '.join(chunk_words))
i += chunk_size - overlap
return chunks