# api/routes.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import json

from api.database import get_db
from api.models import AIAgent, Conversation
from api.ai_service import ai_service
from pydantic import BaseModel

router = APIRouter()

# ----------------------------
# Pydantic models
# ----------------------------
class AgentCreate(BaseModel):
    name: str
    description: str
    system_prompt: str
    knowledge_texts: List[str] = []


class AgentResponse(BaseModel):
    id: int
    name: str
    description: str
    system_prompt: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True  # Changed from from_attributes for Pydantic v1


class QueryRequest(BaseModel):
    agent_id: int
    user_query: str


class QueryResponse(BaseModel):
    response: str
    agent_id: int


class ConversationResponse(BaseModel):
    id: int
    agent_id: int
    user_query: str
    agent_response: str
    created_at: datetime

    class Config:
        orm_mode = True  # Changed from from_attributes for Pydantic v1


# ----------------------------
# Routes
# ----------------------------

@router.post("/agents/", response_model=AgentResponse)
def create_agent(agent: AgentCreate, db: Session = Depends(get_db)):
    """Create a new AI agent with duplicate name validation"""

    # Check for existing name
    existing_agent = db.query(AIAgent).filter(AIAgent.name == agent.name).first()
    if existing_agent:
        raise HTTPException(
            status_code=400,
            detail=f"Agent with name '{agent.name}' already exists. Please choose a different name."
        )

    # Create new agent
    db_agent = AIAgent(
        name=agent.name,
        description=agent.description,
        system_prompt=agent.system_prompt,
        knowledge_base_files=json.dumps(agent.knowledge_texts) if agent.knowledge_texts else None
    )

    # Initialize AI service
    ai_service.create_agent(agent.system_prompt, agent.knowledge_texts)

    db.add(db_agent)
    db.commit()
    db.refresh(db_agent)

    # ✅ Changed to from_orm for Pydantic v1
    return AgentResponse.from_orm(db_agent)


@router.get("/agents/", response_model=List[AgentResponse])
def list_agents(db: Session = Depends(get_db)):
    """List all AI agents"""
    agents = db.query(AIAgent).all()
    # ✅ Changed to from_orm for Pydantic v1
    return [AgentResponse.from_orm(a) for a in agents]


@router.delete("/agents/{agent_id}")
def delete_agent(agent_id: int, db: Session = Depends(get_db)):
    """Delete an AI agent and its conversations"""
    print(f"DEBUG: Attempting to delete agent {agent_id}")  # Add this line
    
    agent = db.query(AIAgent).filter(AIAgent.id == agent_id).first()
    if not agent:
        print(f"DEBUG: Agent {agent_id} not found")  # Add this line
        raise HTTPException(status_code=404, detail="Agent not found")

    print(f"DEBUG: Found agent '{agent.name}', deleting conversations...")  # Add this line
    
    # Delete associated conversations first
    conversations_deleted = db.query(Conversation).filter(Conversation.agent_id == agent_id).delete()
    print(f"DEBUG: Deleted {conversations_deleted} conversations")  # Add this line

    db.delete(agent)
    db.commit()
    print(f"DEBUG: Agent '{agent.name}' deleted successfully")  # Add this line

    return {"message": f"Agent '{agent.name}' deleted successfully"}


@router.post("/query/", response_model=QueryResponse)
def query_agent(request: QueryRequest, db: Session = Depends(get_db)):
    """Query an AI agent"""

    agent = db.query(AIAgent).filter(AIAgent.id == request.agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    # Get AI-generated response
    response = ai_service.query_agent(
        user_query=request.user_query,
        system_prompt=agent.system_prompt
    )

    # Save conversation
    conversation = Conversation(
        agent_id=agent.id,
        user_query=request.user_query,
        agent_response=response
    )
    db.add(conversation)
    db.commit()
    db.refresh(conversation)

    return QueryResponse(response=response, agent_id=agent.id)


@router.get("/agents/{agent_id}/conversations", response_model=List[ConversationResponse])
def get_agent_conversations(agent_id: int, db: Session = Depends(get_db)):
    """Get conversation history for an agent"""
    conversations = (
        db.query(Conversation)
        .filter(Conversation.agent_id == agent_id)
        .order_by(Conversation.created_at.desc())
        .limit(50)
        .all()
    )

    # ✅ Changed to from_orm for Pydantic v1
    return [ConversationResponse.from_orm(c) for c in conversations]