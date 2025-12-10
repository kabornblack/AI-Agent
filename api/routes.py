# api/routes.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List
import fitz
import io
import jwt
import os
from dotenv import load_dotenv
from sqlalchemy import func

load_dotenv()

# Read from environment variables
ADMIN_EMAILS = [email.strip() for email in os.getenv("ADMIN_EMAILS", "").split(",") if email.strip()]
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")

from .database import get_db
from .models import Agent, AgentKnowledge, Conversation, Company, CompanyUser, User
from .schemas import (
    AgentCreate,
    AgentResponse,
    QueryRequest,
    QueryResponse,
    UserCreate,
    UserLogin,
    UserOut,
    Token,
)
from .security import (
    get_current_user,
    require_company_member,
    get_password_hash,
    verify_password,
    create_access_token,
    require_company_role,
)
from .ai_service import ai_service

# ✅ Two separate routers
auth_router = APIRouter(prefix="/api/v1/auth", tags=["auth"])
main_router = APIRouter(prefix="/api/v1", tags=["companies"])

ADMIN_EMAILS = [email.strip() for email in os.getenv("ADMIN_EMAILS", "").split(",") if email.strip()]


# =======================================================
# 🔐 AUTH ROUTES
# =======================================================

@auth_router.post("/admin-login", response_model=dict)
def admin_login(payload: UserLogin, db: Session = Depends(get_db)):
    """Platform admin login with shared password"""
    admin_emails = {e.strip().lower() for e in os.getenv("ADMIN_EMAILS", "").split(",") if e.strip()}
    admin_password = os.getenv("ADMIN_PASSWORD")

    email = payload.email.strip().lower()
    password = payload.password.strip()

    # 1️⃣ Validate email and password
    if email not in admin_emails:
        raise HTTPException(status_code=403, detail="Not a platform admin email")
    if not admin_password or password != admin_password:
        raise HTTPException(status_code=401, detail="Invalid admin password")

    # 2️⃣ Find or create admin user in DB
    user = db.query(User).filter(func.lower(User.email) == email).first()

    if not user:
        # First-time admin login: create user record
        user = User(
            email=email,
            hashed_password=get_password_hash(admin_password),
            is_admin=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Always enforce admin flag and shared password
        user.is_admin = True
        # 🔧 Force-reset password hash to the shared ADMIN_PASSWORD every time
        user.hashed_password = get_password_hash(admin_password)
        db.commit()
        db.refresh(user)

    # 3️⃣ Issue token
    token = create_access_token(sub=user.email, is_admin=True)

    return {
        "access_token": token,
        "user_id": user.id,
        "email": user.email,
        "is_admin": True
    }

@auth_router.post("/register-company", response_model=UserOut)
def register_company(payload: UserCreate, company_name: str, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")

    existing_company = (
    db.query(Company)
    .filter(func.lower(Company.name) == company_name.lower())
    .first()
    )
    if existing_company:
        raise HTTPException(status_code=400, detail="Company already exists")
        if existing_company:
            raise HTTPException(status_code=400, detail="Company already exists")

    company = Company(name=company_name)
    db.add(company)
    db.commit()
    db.refresh(company)

    user = User(
    email=payload.email,
    hashed_password=get_password_hash(payload.password),
    is_admin=(payload.email in ADMIN_EMAILS),
)

    db.add(user)
    db.commit()
    db.refresh(user)

    link = CompanyUser(company_id=company.id, user_id=user.id, role="owner")
    db.add(link)
    db.commit()

    return user

@auth_router.post("/register-user", response_model=UserOut)
def register_user(payload: UserCreate, company_name: str, db: Session = Depends(get_db)):
    """
    Register a new user under an existing company.
    The company must already exist.
    """
    company = db.query(Company).filter(Company.name == company_name).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")

    # create user
    user = User(
    email=payload.email,
    hashed_password=get_password_hash(payload.password),
    is_admin=False,
    )
 
    db.add(user)
    db.commit()
    db.refresh(user)

    # link user to company as "member"
    link = CompanyUser(company_id=company.id, user_id=user.id, role="member")
    db.add(link)
    db.commit()

    return user


@main_router.post("/companies/{company_id}/add-user")
def add_user_to_company(
    company_id: int,
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Allow company owner/admin to add a new member to their company."""
    # Check if current user is an owner/admin of this company
    link = (
        db.query(CompanyUser)
        .filter(CompanyUser.company_id == company_id, CompanyUser.user_id == user.id)
        .first()
    )
    if not link or link.role not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Only company admin can add members.")

    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists.")
    
    new_user = User(
    email=email,
    hashed_password=get_password_hash(password),
    is_admin=False,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    new_link = CompanyUser(company_id=company_id, user_id=new_user.id, role="member")
    db.add(new_link)
    db.commit()

    return {"detail": f"User {email} added successfully to company {company_id}."}

@main_router.post("/companies/{company_id}/invite", response_model=dict)
def invite_user_to_company(
    company_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Allow company owners/admins to invite new members"""
    require_company_role(company_id, current_user, db, ["owner", "admin"])

    email = payload.get("email")
    password = payload.get("password")
    role = payload.get("role", "member")

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password required")

    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User with that email already exists")

    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    user = User(
    email=email,
    hashed_password=get_password_hash(password),
    is_admin=False,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    # Link to company
    link = CompanyUser(user_id=user.id, company_id=company.id, role=role)
    db.add(link)
    db.commit()

    return {"message": f"User {email} added to {company.name} as {role}"}


@auth_router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(sub=user.email, is_admin=bool(user.is_admin))
    
    # Return user info along with token
    return {
        "access_token": token,
        "user_id": user.id,
        "email": user.email,
        "is_admin": bool(user.is_admin)
    }


# =======================================================
# 🧠 COMPANY + AGENT MANAGEMENT
# =======================================================
@main_router.get("/companies")
def list_companies(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """List all companies accessible to the current user."""
    if user.is_admin:
        # Platform admins see ALL companies
        companies = db.query(Company).all()
        output = []
        for c in companies:
            # Platform admins have no role in companies, they're super-admins
            knowledge = (
                db.query(AgentKnowledge)
                .filter(AgentKnowledge.company_id == c.id)
                .order_by(AgentKnowledge.created_at.desc())
                .first()
            )
            
            output.append({
                "id": c.id,
                "name": c.name,
                "role": "platform_admin",  # Special role for platform admins
                "created_at": c.created_at,
                "knowledge": {
                    "id": knowledge.id,
                    "knowledge_text": knowledge.knowledge_text,
                    "created_at": knowledge.created_at,
                } if knowledge else None,
                "agents": [
                    {
                        "id": a.id,
                        "name": a.name,
                        "description": a.description,
                        "system_prompt": a.system_prompt,
                        "created_at": a.created_at,
                    }
                    for a in c.agents
                ],
            })
        return output
    else:
        # Regular users see only their companies
        companies = (
            db.query(Company)
            .join(CompanyUser, CompanyUser.company_id == Company.id)
            .filter(CompanyUser.user_id == user.id)
            .all()
        )

        output = []
        for c in companies:
            link = (
                db.query(CompanyUser)
                .filter(CompanyUser.company_id == c.id, CompanyUser.user_id == user.id)
                .first()
            )
            role = link.role if link else "member"

            knowledge = (
                db.query(AgentKnowledge)
                .filter(AgentKnowledge.company_id == c.id)
                .order_by(AgentKnowledge.created_at.desc())
                .first()
            )

            output.append({
                "id": c.id,
                "name": c.name,
                "role": role,
                "created_at": c.created_at,
                "knowledge": {
                    "id": knowledge.id,
                    "knowledge_text": knowledge.knowledge_text,
                    "created_at": knowledge.created_at,
                } if knowledge else None,
                "agents": [
                    {
                        "id": a.id,
                        "name": a.name,
                        "description": a.description,
                        "system_prompt": a.system_prompt,
                        "created_at": a.created_at,
                    }
                    for a in c.agents
                ],
            })
        return output



@main_router.post("/agents", response_model=AgentResponse)
def create_agent(agent: AgentCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Create a new AI agent for a company."""
    company = db.query(Company).filter(Company.name == agent.company_name).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    # require_company_member(company.id, user, db)
    require_company_role(company.id, user, db, ["owner", "admin"])


    existing_agent = (
        db.query(Agent)
        .filter(Agent.name == agent.name, Agent.company_id == company.id)
        .first()
    )
    if existing_agent:
        raise HTTPException(status_code=400, detail="Agent name already exists for this company")

    db_agent = Agent(
        name=agent.name,
        description=agent.description,
        system_prompt=agent.system_prompt,
        company_id=company.id,
    )
    db.add(db_agent)
    db.commit()
    db.refresh(db_agent)

    if agent.knowledge_texts:
        db_knowledge = AgentKnowledge(
            knowledge_text=agent.knowledge_texts[0],
            company_id=company.id,
            agent_id=db_agent.id,
        )
        db.add(db_knowledge)
        db.commit()

    return db_agent


@main_router.get("/companies/{company_id}/agents")
def list_agents_by_company(company_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """List agents belonging to a specific company."""
    require_company_member(company_id, user, db)
    agents = db.query(Agent).filter(Agent.company_id == company_id).all()
    return [
        {
            "id": a.id,
            "name": a.name,
            "description": a.description,
            "system_prompt": a.system_prompt,
            "created_at": a.created_at,
        }
        for a in agents
    ]


@main_router.put("/companies/{company_id}/knowledge", response_model=dict)
def update_company_knowledge(
    company_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update or create company knowledge base."""
    # ✅ Allow both Owner and Admin to edit knowledge
    require_company_role(company_id, current_user, db, ["owner", "admin"])

    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    # Update existing knowledge or create a new one
    knowledge = db.query(AgentKnowledge).filter(AgentKnowledge.company_id == company_id).first()
    if knowledge:
        knowledge.knowledge_text = data.get("knowledge_text", knowledge.knowledge_text)
    else:
        knowledge = AgentKnowledge(
            knowledge_text=data.get("knowledge_text", ""),
            company_id=company_id,
            agent_id=None
        )
        db.add(knowledge)

    db.commit()
    db.refresh(knowledge)

    return {"message": "Knowledge updated successfully", "knowledge": knowledge.knowledge_text}


# ----------------------------
# Get Conversations for Agent
# ----------------------------
@main_router.get("/agents/{agent_id}/conversations")
def get_agent_conversations(agent_id: int, db: Session = Depends(get_db)):
    """Fetch all past conversations for a specific agent."""
    from .models import Conversation

    conversations = (
        db.query(Conversation)
        .filter(Conversation.agent_id == agent_id)
        .order_by(Conversation.created_at.desc())
        .all()
    )

    if not conversations:
        return []  # ✅ empty list instead of 404 (frontend-friendly)

    return [
        {
            "id": conv.id,
            "agent_id": conv.agent_id,
            "user_query": conv.user_query,
            "agent_response": conv.agent_response,
            "created_at": conv.created_at,
        }
        for conv in conversations
    ]


# =======================================================
# 💬 AGENT CHAT (QUERY)
# =======================================================
@main_router.post("/query", response_model=QueryResponse)
def query_agent(
    request: QueryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Query an AI agent using the company's knowledge."""
    agent = db.query(Agent).filter(Agent.id == request.agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    # Allow owner, admin, member of the agent's company
    require_company_role(agent.company_id, current_user, db, ["owner", "admin", "member"])

    company = db.query(Company).filter(Company.id == agent.company_id).first()
    knowledge = (
        db.query(AgentKnowledge)
        .filter(AgentKnowledge.company_id == company.id)
        .order_by(AgentKnowledge.created_at.desc())
        .first()
    )

    if not knowledge:
        return QueryResponse(
            response="⚠️ This company has no knowledge base yet. Please add knowledge and try again.",
            agent_id=agent.id,
        )

    response = ai_service.query_agent(
        user_query=request.user_query,
        system_prompt=agent.system_prompt,
        company_name=company.name,
        knowledge_text=knowledge.knowledge_text,
    )

    conversation = Conversation(agent_id=agent.id, user_query=request.user_query, agent_response=response)
    db.add(conversation)
    db.commit()

    return QueryResponse(response=response, agent_id=agent.id)

# =======================================================
# 🧹 DELETE OPERATIONS
# =======================================================
@main_router.delete("/companies/{company_id}")
def delete_company(
    company_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Owner deletes THEIR company.
    Also remove any non-admin users who end up with zero company memberships.
    """
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    # Only owner of this company can delete it
    require_company_role(company_id, user, db, ["owner"])

    # --- Collect users linked to this company BEFORE we delete links ---
    linked_user_ids = [
        cu.user_id
        for cu in db.query(CompanyUser.user_id).filter(CompanyUser.company_id == company_id).all()
    ]

    company_name = company.name

    # --- Delete related rows (conversations -> knowledge -> agents -> links -> company) ---
    # Conversations via agents
    db.query(Conversation).filter(
        Conversation.agent_id.in_(db.query(Agent.id).filter(Agent.company_id == company_id))
    ).delete(synchronize_session=False)

    # Knowledge
    db.query(AgentKnowledge).filter(AgentKnowledge.company_id == company_id).delete(synchronize_session=False)

    # Agents
    db.query(Agent).filter(Agent.company_id == company_id).delete(synchronize_session=False)

    # Company-user links
    db.query(CompanyUser).filter(CompanyUser.company_id == company_id).delete(synchronize_session=False)

    # Company
    db.delete(company)
    db.commit()

    # --- Orphan user cleanup (non-platform-admins only) ---
    # Delete any user (not platform admin) with zero remaining company links
    for uid in linked_user_ids:
        u = db.query(User).filter(User.id == uid).first()
        if not u:
            continue
        if u.is_admin:   # keep platform admins
            continue
        remaining_links = db.query(CompanyUser).filter(CompanyUser.user_id == uid).count()
        if remaining_links == 0:
            db.delete(u)
    db.commit()

    return {"detail": f"Company '{company_name}' deleted successfully (orphan users removed)"}

@main_router.delete("/agents/{agent_id}")
def delete_agent(agent_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Allow owner or admin to delete an agent."""
    # Fetch agent first ✅
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    # Check permissions now that agent exists
    require_company_role(agent.company_id, user, db, ["owner", "admin"])

    db.delete(agent)
    db.commit()

    return {"detail": f"Agent '{agent.name}' deleted successfully"}


# =======================================================
# 🛡️ ADMIN-ONLY DEBUG ROUTES
# =======================================================
@main_router.get("/debug/companies-public")
def debug_list_companies_public(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Admin: View all companies and their data"""
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    companies = db.query(Company).all()
    out = []
    for c in companies:
        knowledge = (
            db.query(AgentKnowledge)
            .filter(AgentKnowledge.company_id == c.id)
            .order_by(AgentKnowledge.created_at.desc())
            .first()
        )
        out.append({
            "id": c.id,
            "name": c.name,
            "created_at": c.created_at,
            "knowledge": {
                "id": knowledge.id,
                "knowledge_text": knowledge.knowledge_text,
                "created_at": knowledge.created_at
            } if knowledge else None,
            "agents": [
                {
                    "id": a.id,
                    "name": a.name,
                    "description": a.description,
                    "system_prompt": a.system_prompt,
                    "created_at": a.created_at,
                } for a in c.agents
            ]
        })
    return out


@main_router.get("/debug/all-data", response_model=dict)
def debug_all_data(db: Session = Depends(get_db)):
    """View all companies, users, agents, and knowledge (admin only)."""
    companies = db.query(Company).all()
    users = db.query(User).all()
    data = []

    for c in companies:
        company_info = {
            "id": c.id,
            "name": c.name,
            "created_at": c.created_at,
            "knowledge": None,
            "agents": [],
            "members": [],
        }

        # Knowledge
        knowledge = db.query(AgentKnowledge).filter(AgentKnowledge.company_id == c.id).first()
        if knowledge:
            company_info["knowledge"] = {
                "id": knowledge.id,
                "knowledge_text": knowledge.knowledge_text,
                "created_at": knowledge.created_at
            }

        # Agents
        agents = db.query(Agent).filter(Agent.company_id == c.id).all()
        for a in agents:
            company_info["agents"].append({
                "id": a.id,
                "name": a.name,
                "description": a.description,
                "system_prompt": a.system_prompt,
                "created_at": a.created_at
            })

        # Members (users linked to this company)
        links = db.query(CompanyUser).filter(CompanyUser.company_id == c.id).all()
        for link in links:
            user = db.query(User).filter(User.id == link.user_id).first()
            if user:
                company_info["members"].append({
                    "user_id": user.id,
                    "email": user.email,
                    "role": link.role,
                    "is_admin": bool(user.is_admin),
                })

        data.append(company_info)

    # All users globally
    users_data = [
        {"id": u.id, "email": u.email, "is_admin": bool(u.is_admin)}
        for u in users
    ]

    return {"companies": data, "users": users_data}

# =======================================================
# OWNER AND ADMIN TO MANAGE OTHER USERS
# =======================================================

@main_router.get("/companies/{company_id}/users", response_model=list)
def list_company_users(
    company_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all users in a company"""
    require_company_role(company_id, current_user, db, ["owner", "admin"])
    users = (
        db.query(User, CompanyUser)
        .join(CompanyUser, CompanyUser.user_id == User.id)
        .filter(CompanyUser.company_id == company_id)
        .all()
    )
    result = []
    for user, cu in users:
        result.append({
            "id": user.id,
            "email": user.email,
            "role": cu.role,
            "created_at": user.created_at
        })
    return result


@main_router.delete("/companies/{company_id}/users/{user_id}", response_model=dict)
def delete_user_from_company(
    company_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Allow owner/admin to fully delete a user (including their login)."""
    require_company_role(company_id, current_user, db, ["owner", "admin"])

    # Prevent users from deleting themselves
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Verify the user actually belongs to this company
    company_user = db.query(CompanyUser).filter(
        CompanyUser.company_id == company_id, 
        CompanyUser.user_id == user_id
    ).first()
    
    if not company_user:
        raise HTTPException(status_code=404, detail="User not found in company")

    # Delete company user link
    db.query(CompanyUser).filter(CompanyUser.user_id == user_id).delete()

    # Delete the actual user record
    db.delete(user)
    db.commit()

    return {"message": f"User {user.email} permanently deleted"}


@main_router.delete("/admin/companies/{company_id}", response_model=dict)
def admin_delete_company(
    company_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Platform admin: Delete a company and all its data.
    Also remove any non-admin users who end up with zero company memberships.
    """
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Platform admin access required")

    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    # --- Collect users linked to this company BEFORE we delete links ---
    linked_user_ids = [
        cu.user_id
        for cu in db.query(CompanyUser.user_id).filter(CompanyUser.company_id == company_id).all()
    ]

    company_name = company.name

    # --- Delete related rows (conversations -> knowledge -> agents -> links -> company) ---
    db.query(Conversation).filter(
        Conversation.agent_id.in_(db.query(Agent.id).filter(Agent.company_id == company_id))
    ).delete(synchronize_session=False)

    db.query(AgentKnowledge).filter(AgentKnowledge.company_id == company_id).delete(synchronize_session=False)

    db.query(Agent).filter(Agent.company_id == company_id).delete(synchronize_session=False)

    db.query(CompanyUser).filter(CompanyUser.company_id == company_id).delete(synchronize_session=False)

    db.delete(company)
    db.commit()

    # --- Orphan user cleanup (non-platform-admins only) ---
    for uid in linked_user_ids:
        u = db.query(User).filter(User.id == uid).first()
        if not u:
            continue
        if u.is_admin:   # keep platform admins
            continue
        remaining_links = db.query(CompanyUser).filter(CompanyUser.user_id == uid).count()
        if remaining_links == 0:
            db.delete(u)
    db.commit()

    return {"message": f"Company '{company_name}' and all related data deleted successfully (orphan users removed)"}


# =======================================================
# CHATBOT
# =======================================================
# @main_router.get("/companies/{company_id}/chatbot-settings")
# def get_chatbot_settings(
#     company_id: int,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user)
# ):
#     """Get chatbot settings for a company"""
#     require_company_role(company_id, current_user, db, ["owner", "admin"])
    
#     # Default settings
#     default_settings = {
#         "enabled": True,
#         "welcome_message": "Hello! I'm your AI assistant. How can I help you today?",
#         "support_email": "",
#         "theme_color": "#2563eb",
#         "working_hours": "9 AM - 6 PM, Monday to Friday",
#     }
    
#     # In a real app, you'd store these in a database table
#     # For now, return defaults
#     return {"settings": default_settings}

# @main_router.put("/companies/{company_id}/chatbot-settings")
# def update_chatbot_settings(
#     company_id: int,
#     settings_data: dict,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user)
# ):
#     """Update chatbot settings"""
#     require_company_role(company_id, current_user, db, ["owner", "admin"])
    
#     # In a real app, save to database
#     # For now, just acknowledge
#     return {"message": "Settings updated successfully"}

@main_router.get("/companies/{company_id}/chatbot-settings")
def get_chatbot_settings(
    company_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get chatbot settings for a company"""
    # Platform admins can access any company
    if not current_user.is_admin:
        require_company_role(company_id, current_user, db, ["owner", "admin"])
    
    # For now, return default settings
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    default_settings = {
        "enabled": True,
        "welcome_message": f"Hello! I'm the {company.name} AI assistant. How can I help you today?",
        "support_email": "",
        "theme_color": "#2563eb",
        "working_hours": "9 AM - 6 PM, Monday to Friday",
        "position": "bottom-right",
        "collect_email": True
    }
    
    return {"settings": default_settings}

@main_router.post("/companies/{company_id}/chatbot-settings")
def update_chatbot_settings(
    company_id: int,
    settings_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update chatbot settings"""
    # Platform admins can access any company
    if not current_user.is_admin:
        require_company_role(company_id, current_user, db, ["owner", "admin"])
    
    # In a real implementation, you would save to database
    # For now, just return success
    return {
        "message": "Chatbot settings updated successfully",
        "settings": settings_data
    }

