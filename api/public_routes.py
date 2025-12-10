# api/public_routes.py
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import Optional
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv
from datetime import datetime

from .database import get_db
from .models import Company, AgentKnowledge, Agent, User
from .ai_service import ai_service
from .security import decode_token

load_dotenv()

public_router = APIRouter(prefix="/api/v1/public", tags=["public"])

# Helper to get current user (optional for public routes)
def get_current_user_optional(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    if not authorization:
        return None
    
    try:
        # Remove "Bearer " prefix if present
        token = authorization
        if authorization.startswith("Bearer "):
            token = authorization[7:]
        
        payload = decode_token(token)
        if payload is None:
            return None
        
        email = payload.get("sub")
        if not email:
            return None
        
        user = db.query(User).filter(User.email == email).first()
        return user
    except Exception:
        return None

@public_router.get("/")
def public_root():
    return {"message": "Public API is running", "version": "1.0.0"}


@public_router.get("/company/{company_identifier}")
async def get_public_company_info(
    company_identifier: str,
    db: Session = Depends(get_db)
):
    """Get public company information for the chatbot"""
    company = None
    
    # Try by ID or name
    if company_identifier.isdigit():
        company = db.query(Company).filter(Company.id == int(company_identifier)).first()
    else:
        company = db.query(Company).filter(Company.name == company_identifier).first()
    
    if not company:
        # Return platform info if company not found
        company = db.query(Company).filter(Company.name.ilike("%platform%")).first()
        if not company:
            # Create platform company if it doesn't exist
            company = Company(name="AI Agent Platform")
            db.add(company)
            db.commit()
            db.refresh(company)
    
    # Get or create knowledge
    knowledge = (
        db.query(AgentKnowledge)
        .filter(AgentKnowledge.company_id == company.id)
        .order_by(AgentKnowledge.created_at.desc())
        .first()
    )
    
    if not knowledge:
        # Create default knowledge
        default_knowledge = "This company is using the AI Agent Platform. Please add company knowledge to enable the chatbot."
        knowledge = AgentKnowledge(
            knowledge_text=default_knowledge,
            company_id=company.id
        )
        db.add(knowledge)
        db.commit()
        db.refresh(knowledge)
    
    # Get or create public agent
    agent = (
        db.query(Agent)
        .filter(Agent.company_id == company.id, Agent.name.ilike("%public%"))
        .first()
    )
    
    if not agent:
        agent = (
            db.query(Agent)
            .filter(Agent.company_id == company.id)
            .first()
        )
    
    if not agent:
        # Create a default public agent
        agent = Agent(
            name="Public Assistant",
            description="Public AI assistant for answering questions",
            system_prompt="You are a helpful AI assistant. Answer questions based on company knowledge.",
            company_id=company.id
        )
        db.add(agent)
        db.commit()
        db.refresh(agent)
    
    return {
        "id": company.id,
        "name": company.name,
        "knowledge": knowledge.knowledge_text,
        "agent_id": agent.id,
        "system_prompt": agent.system_prompt,
        "support_email": os.getenv("DEFAULT_SUPPORT_EMAIL", "support@aiagentplatform.com"),
        "has_knowledge": len(knowledge.knowledge_text.strip()) > 50  # Check if has real content
    }

# @public_router.get("/company/{company_identifier}")
# async def get_public_company_info(
#     company_identifier: str,
#     db: Session = Depends(get_db)
# ):
#     """Get public company information for the chatbot"""
#     company = None
    
#     # Try by ID or name
#     if company_identifier.isdigit():
#         company = db.query(Company).filter(Company.id == int(company_identifier)).first()
#     else:
#         company = db.query(Company).filter(Company.name == company_identifier).first()
    
#     if not company:
#         # Return platform info if company not found
#         company = db.query(Company).filter(Company.name.ilike("%platform%")).first()
#         if not company:
#             company = db.query(Company).filter(Company.name.ilike("%default%")).first()
#             if not company:
#                 # Create a default platform company
#                 company = Company(name="AI Agent Platform")
#                 db.add(company)
#                 db.commit()
#                 db.refresh(company)
    
#     # Get latest knowledge
#     knowledge = (
#         db.query(AgentKnowledge)
#         .filter(AgentKnowledge.company_id == company.id)
#         .order_by(AgentKnowledge.created_at.desc())
#         .first()
#     )
    
#     # Get public agent (first agent or create default)
#     agent = (
#         db.query(Agent)
#         .filter(Agent.company_id == company.id, Agent.name.ilike("%public%"))
#         .first()
#     )
    
#     if not agent:
#         agent = (
#             db.query(Agent)
#             .filter(Agent.company_id == company.id)
#             .first()
#         )
    
#     if not agent:
#         # Create a default public agent
#         agent = Agent(
#             name="Public Assistant",
#             description="Public AI assistant for answering questions",
#             system_prompt="You are a helpful AI assistant for this company. Answer questions based on the company knowledge base. If you don't know something, politely ask for more information or suggest contacting support.",
#             company_id=company.id
#         )
#         db.add(agent)
#         db.commit()
#         db.refresh(agent)
    
#     return {
#         "id": company.id,
#         "name": company.name,
#         "knowledge": knowledge.knowledge_text if knowledge else "",
#         "agent_id": agent.id,
#         "system_prompt": agent.system_prompt,
#         "support_email": os.getenv("DEFAULT_SUPPORT_EMAIL", "support@yourapp.com"),
#         "has_knowledge": bool(knowledge)
#     }

@public_router.post("/query")
async def public_query(
    query_data: dict,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_optional)
):
    """Public endpoint for chatbot queries"""
    user_query = query_data.get("user_query", "").strip()
    company_name = query_data.get("company_name", "platform")
    user_email = query_data.get("user_email", None)
    
    if not user_query:
        raise HTTPException(status_code=400, detail="Query is required")
    
    # Get company info
    company = None
    
    if company_name == "platform":
        # Try to find platform company by name
        company = db.query(Company).filter(Company.name.ilike("%platform%")).first()
        
        # If no platform company exists, create one
        if not company:
            company = Company(name="AI Agent Platform")
            db.add(company)
            db.commit()
            db.refresh(company)
            print(f"✅ Created platform company: {company.id} - {company.name}")
    else:
        company = db.query(Company).filter(Company.name == company_name).first()
    
    if not company:
        # Create a default company if none exists
        company = Company(name="Default Company")
        db.add(company)
        db.commit()
        db.refresh(company)
        print(f"✅ Created default company: {company.id} - {company.name}")
    
    # Get knowledge - create default if none exists
    knowledge = (
        db.query(AgentKnowledge)
        .filter(AgentKnowledge.company_id == company.id)
        .order_by(AgentKnowledge.created_at.desc())
        .first()
    )
    
    if not knowledge:
        # Create default knowledge for the platform
        default_knowledge = """This is the AI Agent Platform - a tool for creating custom AI assistants.
        
        Features:
        - Create AI agents for customer support
        - Add company knowledge bases
        - Embed chatbots on websites
        - No coding required
        
        Pricing:
        - Basic: Free for up to 100 queries/month
        - Pro: $29/month for unlimited queries
        - Enterprise: Custom pricing
        
        Contact: support@aiagentplatform.com"""
        
        knowledge = AgentKnowledge(
            knowledge_text=default_knowledge,
            company_id=company.id
        )
        db.add(knowledge)
        db.commit()
        db.refresh(knowledge)
        print(f"✅ Created default knowledge for company: {company.name}")
    
    # Get or create public agent
    agent = (
        db.query(Agent)
        .filter(Agent.company_id == company.id, Agent.name.ilike("%public%"))
        .first()
    )
    
    if not agent:
        agent = (
            db.query(Agent)
            .filter(Agent.company_id == company.id)
            .first()
        )
    
    if not agent:
        # Create a default public agent
        agent = Agent(
            name="Public Assistant",
            description="Public AI assistant for answering questions",
            system_prompt="""You are a helpful AI assistant for this company. 
            Answer questions based on the company knowledge base. 
            Be friendly and professional. 
            If you don't know something, politely ask for more information or suggest contacting support.
            Keep responses concise and helpful.""",
            company_id=company.id
        )
        db.add(agent)
        db.commit()
        db.refresh(agent)
        print(f"✅ Created public agent for company: {company.name}")
    
    # Use AI service
    try:
        response = ai_service.query_agent(
            user_query=user_query,
            system_prompt=agent.system_prompt,
            company_name=company.name,
            knowledge_text=knowledge.knowledge_text,
        )
        
        print(f"✅ AI Response generated for: '{user_query[:50]}...'")
        
        # Check if response indicates lack of knowledge
        requires_email = False
        if any(phrase in response.lower() for phrase in [
            "don't know", "don't have", "no information", "not provided",
            "cannot answer", "unable to", "not sure", "lack of information",
            "enough info", "i don't"
        ]):
            requires_email = True
        
        return {
            "response": response,
            "agent_id": agent.id,
            "requires_email": requires_email,
            "company_name": company.name
        }
        
    except Exception as e:
        print(f"❌ AI query error: {e}")
        # Return a friendly error message
        return {
            "response": "I'm having trouble processing your question right now. Please try again or contact support if the issue persists.",
            "agent_id": agent.id if agent else 0,
            "requires_email": True,
            "company_name": company.name
        }

# @public_router.post("/query")
# async def public_query(
#     query_data: dict,
#     db: Session = Depends(get_db),
#     user: Optional[User] = Depends(get_current_user_optional)
# ):
#     """Public endpoint for chatbot queries"""
#     user_query = query_data.get("user_query", "").strip()
#     company_name = query_data.get("company_name", "platform")
#     user_email = query_data.get("user_email", None)
    
#     if not user_query:
#         raise HTTPException(status_code=400, detail="Query is required")
    
#     # Get company info
#     company = None
#     if company_name == "platform":
#         company = db.query(Company).filter(Company.name.ilike("%platform%")).first()
#     else:
#         company = db.query(Company).filter(Company.name == company_name).first()
    
#     if not company:
#         company = db.query(Company).filter(Company.name.ilike("%platform%")).first()
#         if not company:
#             raise HTTPException(status_code=404, detail="Company not found")
    
#     # Get knowledge
#     knowledge = (
#         db.query(AgentKnowledge)
#         .filter(AgentKnowledge.company_id == company.id)
#         .order_by(AgentKnowledge.created_at.desc())
#         .first()
#     )
    
#     # Get or create public agent
#     agent = (
#         db.query(Agent)
#         .filter(Agent.company_id == company.id, Agent.name.ilike("%public%"))
#         .first()
#     )
    
#     if not agent:
#         agent = Agent(
#             name="Public Assistant",
#             description="Public AI assistant",
#             system_prompt="You are a helpful assistant. Answer based on company knowledge.",
#             company_id=company.id
#         )
#         db.add(agent)
#         db.commit()
#         db.refresh(agent)
    
#     # Determine if we should use email fallback
#     requires_email = False
#     response_text = ""
    
#     if knowledge:
#         # Check if this is a basic question we can answer
#         basic_questions = {
#             "hello": f"Hello! Welcome to {company.name}. How can I assist you today?",
#             "hi": f"Hi there! I'm the {company.name} assistant. What can I help you with?",
#             "help": f"I can answer questions about {company.name}'s services, pricing, features, and more. What would you like to know?",
#             "what can you do": f"I can help you with information about {company.name}'s products, services, and policies. I can also forward complex questions to our support team.",
#             "thank": "You're welcome! Is there anything else I can help you with?",
#             "bye": "Goodbye! Feel free to come back if you have more questions.",
#         }
        
#         query_lower = user_query.lower()
#         for keyword, answer in basic_questions.items():
#             if keyword in query_lower:
#                 response_text = answer
#                 break
        
#         if not response_text:
#             # Use AI service
#             try:
#                 response = ai_service.query_agent(
#                     user_query=user_query,
#                     system_prompt=agent.system_prompt,
#                     company_name=company.name,
#                     knowledge_text=knowledge.knowledge_text,
#                 )
                
#                 # Check if AI doesn't know
#                 if any(phrase in response.lower() for phrase in [
#                     "don't know", "don't have", "no information", "not provided",
#                     "cannot answer", "unable to", "not sure", "lack of information"
#                 ]):
#                     requires_email = True
#                     response_text = f"I don't have enough specific information about that in our knowledge base. Would you like me to forward your question to our support team for a detailed response?"
#                 else:
#                     response_text = response
                    
#             except Exception as e:
#                 print(f"AI query error: {e}")
#                 requires_email = True
#                 response_text = "I'm having trouble accessing the information right now. Would you like to send your question to our support team?"
#     else:
#         # No knowledge base
#         requires_email = True
#         response_text = f"I don't have enough information about {company.name} to answer that question. Please contact our support team for assistance."
    
#     return {
#         "response": response_text,
#         "agent_id": agent.id,
#         "requires_email": requires_email,
#         "company_name": company.name
#     }

@public_router.post("/email")
async def send_support_email(email_data: dict):
    """Send email to support team when bot doesn't know"""
    subject = email_data.get("subject", "Question from Chatbot")
    body = email_data.get("body", "")
    to_email = email_data.get("to_email", os.getenv("DEFAULT_SUPPORT_EMAIL", "support@yourapp.com"))
    user_email = email_data.get("user_email", "anonymous@user.com")
    
    # Format email body
    formatted_body = f"""
Question from Chatbot User:
Email: {user_email}
Subject: {subject}

Question Details:
{body}

---
This email was automatically generated by the AI Chatbot system.
Time: {datetime.now().isoformat()}
"""
    
    # Get email credentials from env
    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_username = os.getenv("SMTP_USERNAME", "")
    smtp_password = os.getenv("SMTP_PASSWORD", "")
    
    if not smtp_username or not smtp_password:
        # Log to console if email not configured
        print(f"\n📧 Email would be sent to: {to_email}")
        print(f"From: {user_email}")
        print(f"Subject: {subject}")
        print(f"Body: {formatted_body}\n")
        
        # In demo mode, save to file
        try:
            with open("chatbot_emails.log", "a") as f:
                f.write(f"\n{'='*50}\n")
                f.write(f"Time: {datetime.now().isoformat()}\n")
                f.write(f"To: {to_email}\n")
                f.write(f"From: {user_email}\n")
                f.write(f"Subject: {subject}\n")
                f.write(f"Body:\n{body}\n")
            return {"status": "logged", "message": "Email saved to file (demo mode)"}
        except Exception as e:
            return {"status": "logged", "message": f"Demo mode: {str(e)}"}
    
    try:
        # Create message
        msg = MIMEMultipart()
        msg["From"] = smtp_username
        msg["To"] = to_email
        msg["Subject"] = f"Chatbot Support: {subject}"
        
        # Add body
        msg.attach(MIMEText(formatted_body, "plain"))
        
        # Send email
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_username, smtp_password)
            server.send_message(msg)
        
        return {"status": "success", "message": "Email sent successfully"}
    
    except Exception as e:
        print(f"Email error: {e}")
        return {"status": "error", "message": str(e)}

@public_router.get("/embed/{company_id}")
async def get_chatbot_embed_code(company_id: int, db: Session = Depends(get_db)):
    """Get embed code for companies to add chatbot to their website"""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    embed_code = f"""
<!-- {company.name} AI Chatbot -->
<div id="chatbot-container-{company_id}"></div>
<script>
  (function() {{
    var container = document.getElementById('chatbot-container-{company_id}');
    if (!container) return;
    
    var iframe = document.createElement('iframe');
    iframe.src = '{frontend_url}/chatbot/embed/{company_id}';
    iframe.style.cssText = 'position: fixed; bottom: 20px; right: 20px; width: 400px; height: 600px; border: none; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); z-index: 9999;';
    iframe.allow = 'clipboard-write';
    
    container.appendChild(iframe);
  }})();
</script>
<!-- End Chatbot -->
"""
    
    return {
        "embed_code": embed_code,
        "instructions": "Copy and paste this code into your website's HTML before the closing </body> tag",
        "preview_url": f"{frontend_url}/chatbot/embed/{company_id}"
    }

@public_router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "public_chatbot_api"
    }