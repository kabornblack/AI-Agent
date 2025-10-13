# api/models.py
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from sqlalchemy.sql import func
from api.database import Base

class AIAgent(Base):
    __tablename__ = "ai_agents"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    description = Column(Text)
    system_prompt = Column(Text, nullable=False)
    knowledge_base_files = Column(JSON)  # Store file paths or metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Conversation(Base):
    __tablename__ = "conversations"
    
    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(Integer, index=True)
    user_query = Column(Text)
    agent_response = Column(Text)
    context_used = Column(Text)  # Store which parts of knowledge base were used
    created_at = Column(DateTime(timezone=True), server_default=func.now())