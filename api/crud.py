# api/crud.py
from sqlalchemy.orm import Session
from . import models


def create_agent(db: Session, agent_in):
agent = models.Agent(name=agent_in.name, description=agent_in.description, system_prompt=agent_in.system_prompt, rtr_top_k=agent_in.rtr_top_k)
db.add(agent)
db.commit()
db.refresh(agent)
return agent


def get_agent(db: Session, agent_id: int):
return db.query(models.Agent).filter(models.Agent.id == agent_id).first()


def log_chat(db: Session, agent_id:int, user_id:str, user_message:str, agent_reply:str, rtr_score:float=None, rating:int=None):
log = models.ChatLog(agent_id=agent_id, user_id=user_id, user_message=user_message, agent_reply=agent_reply, rtr_score=rtr_score, user_rating=rating)
db.add(log)
db.commit()
db.refresh(log)
return log


def audit(db: Session, actor:str, action:str, details:str):
a = models.AuditLog(actor=actor, action=action, details=details)
db.add(a)
db.commit()
db.refresh(a)
return a