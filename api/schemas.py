# In api/schemas.py
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import List, Optional


# --- Auth / User
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    is_admin: Optional[bool] = False  # only respected when creating via admin endpoint

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    email: EmailStr
    is_admin: bool

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class AgentCreate(BaseModel):
    name: str
    description: str
    system_prompt: str
    knowledge_texts: Optional[List[str]] = [] 
    company_name: Optional[str] = None

class AgentResponse(BaseModel):
    id: int
    name: str
    description: str
    system_prompt: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True  # Changed from orm_mode

class ConversationResponse(BaseModel):
    id: int
    agent_id: int
    user_query: str
    agent_response: str
    created_at: datetime
    
    class Config:
        from_attributes = True  

# Add these missing schemas:
class QueryRequest(BaseModel):
    agent_id: int
    user_query: str

class QueryResponse(BaseModel):
    response: str
    agent_id: int

# For error handling
class HTTPValidationError(BaseModel):
    detail: List[dict]

class ValidationError(BaseModel):
    loc: List[str]
    msg: str
    type: str

class KnowledgeCreate(BaseModel):
    company_name: str
    agent_id: int
    knowledge_text: str

    class Config:
        from_attributes = True

class CompanyLite(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True