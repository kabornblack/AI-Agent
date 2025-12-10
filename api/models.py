from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, UniqueConstraint, Table
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .database import Base


# --- NEW: association table for many-to-many User <-> Company with a role
class CompanyUser(Base):
    __tablename__ = "company_users"
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(50), default="member")  # "owner" | "admin" | "member"

    __table_args__ = (UniqueConstraint("company_id", "user_id", name="uq_company_user"),)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    is_admin = Column(Integer, default=0)  # 1 = platform admin; 0 = normal
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Companies this user belongs to
    companies = relationship(
        "Company",
        secondary="company_users",
        back_populates="users",
        cascade="all",
        overlaps="company_links"
    )
    company_links = relationship("CompanyUser", cascade="all, delete-orphan",
overlaps="companies") 

class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Knowledge relationship (no cascade)
    knowledge_entry = relationship("AgentKnowledge", back_populates="company", uselist=False)
    
    # Agents relationship (with cascade - this is fine)
    agents = relationship("Agent", back_populates="company", cascade="all, delete-orphan")

    # Users relationship (required for the many-to-many)
    users = relationship(
        "User",
        secondary="company_users", 
        back_populates="companies",
        overlaps="company_links"
    )

class Agent(Base):
    __tablename__ = "agents"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    system_prompt = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)

    __table_args__ = (UniqueConstraint("company_id", "name", name="unique_agent_per_company"),)

    company = relationship("Company", back_populates="agents")
    
    # ✅ FIXED: Remove cascade from knowledge relationship
    knowledge_entries = relationship("AgentKnowledge", back_populates="agent")
    
    conversations = relationship("Conversation", back_populates="agent", cascade="all, delete-orphan")

class AgentKnowledge(Base):
    __tablename__ = "agent_knowledge"

    id = Column(Integer, primary_key=True, index=True)
    knowledge_text = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), unique=True)
    
    # ✅ FIXED: Remove cascade from company relationship
    company = relationship("Company", back_populates="knowledge_entry")
    
    # ✅ FIXED: Make agent_id nullable and remove cascade
    agent_id = Column(Integer, ForeignKey("agents.id", ondelete="SET NULL"), nullable=True)
    agent = relationship("Agent", back_populates="knowledge_entries")

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(Integer, ForeignKey("agents.id"))
    user_query = Column(Text)
    agent_response = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    agent = relationship("Agent", back_populates="conversations")
