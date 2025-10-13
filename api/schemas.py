# api/schemas.py
from pydantic import BaseModel
from typing import Optional


class AgentCreate(BaseModel):
name: str
description: Optional[str] = None
system_prompt: Optional[str] = None
rtr_top_k: Optional[int] = 5


class ChatRequest(BaseModel):
agent_id: int
user_id: str
message: str


class ChatResponse(BaseModel):
reply: str
rtr_score: Optional[float] = None