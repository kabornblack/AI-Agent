# api/routes.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import json

from api.database import get_db
from api.models import AIAgent, Conversation
from api.ai_service import ai_service
from pydantic import BaseModel

router = APIRouter()

# Pydantic models for request/response
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

class QueryRequest(BaseModel):
    agent_id: int
    user_query: str

class QueryResponse(BaseModel):
    response: str
    agent_id: int

@router.post("/agents/", response_model=AgentResponse)
def create_agent(agent: AgentCreate, db: Session = Depends(get_db)):
    """Create a new AI agent with duplicate name validation"""
    
    # Check if agent name already exists
    existing_agent = db.query(AIAgent).filter(AIAgent.name == agent.name).first()
    if existing_agent:
        raise HTTPException(
            status_code=400, 
            detail=f"Agent with name '{agent.name}' already exists. Please choose a different name."
        )
    
    # Create agent in database
    db_agent = AIAgent(
        name=agent.name,
        description=agent.description,
        system_prompt=agent.system_prompt,
        knowledge_base_files=json.dumps(agent.knowledge_texts) if agent.knowledge_texts else None
    )
    
    # Initialize the AI agent
    ai_service.create_agent(agent.system_prompt, agent.knowledge_texts)
    
    db.add(db_agent)
    db.commit()
    db.refresh(db_agent)
    
    return db_agent

@router.get("/agents/", response_model=List[AgentResponse])
def list_agents(db: Session = Depends(get_db)):
    """List all AI agents"""
    return db.query(AIAgent).all()

@router.delete("/agents/{agent_id}")
def delete_agent(agent_id: int, db: Session = Depends(get_db)):
    """Delete an AI agent and its conversations"""
    
    # Check if agent exists
    agent = db.query(AIAgent).filter(AIAgent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Delete associated conversations first
    db.query(Conversation).filter(Conversation.agent_id == agent_id).delete()
    
    # Delete the agent
    db.delete(agent)
    db.commit()
    
    return {"message": f"Agent '{agent.name}' deleted successfully"}

@router.post("/query/", response_model=QueryResponse)
def query_agent(request: QueryRequest, db: Session = Depends(get_db)):
    """Query an AI agent"""
    
    # Get agent from database
    agent = db.query(AIAgent).filter(AIAgent.id == request.agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Get response from AI service
    response = ai_service.query_agent(
        user_query=request.user_query,
        system_prompt=agent.system_prompt
    )
    
    # Log conversation
    conversation = Conversation(
        agent_id=agent.id,
        user_query=request.user_query,
        agent_response=response
    )
    db.add(conversation)
    db.commit()
    
    return QueryResponse(response=response, agent_id=agent.id)

@router.get("/agents/{agent_id}/conversations")
def get_agent_conversations(agent_id: int, db: Session = Depends(get_db)):
    """Get conversation history for an agent"""
    conversations = db.query(Conversation).filter(Conversation.agent_id == agent_id).order_by(Conversation.created_at.desc()).limit(50).all()
    return conversations