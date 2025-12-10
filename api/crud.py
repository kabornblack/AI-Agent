# crud.py
from sqlalchemy.orm import Session
from models import Agent, AgentKnowledge, Conversation
from schemas import AgentCreate

def create_agent(db: Session, agent: AgentCreate):
    # Create agent
    db_agent = Agent(
        name=agent.name,
        description=agent.description,
        system_prompt=agent.system_prompt
    )
    db.add(db_agent)
    db.commit()
    db.refresh(db_agent)
    
    # Add knowledge texts
    for knowledge_text in agent.knowledge_texts:
        db_knowledge = AgentKnowledge(
            agent_id=db_agent.id,
            knowledge_text=knowledge_text
        )
        db.add(db_knowledge)
    
    db.commit()
    return db_agent

def get_agent(db: Session, agent_id: int):
    return db.query(Agent).filter(Agent.id == agent_id).first()

def create_conversation(db: Session, agent_id: int, user_query: str, agent_response: str):
    db_conversation = Conversation(
        agent_id=agent_id,
        user_query=user_query,
        agent_response=agent_response
    )
    db.add(db_conversation)
    db.commit()
    db.refresh(db_conversation)
    return db_conversation