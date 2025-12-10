# api/ai_service.py
import google.generativeai as genai
import os
from dotenv import load_dotenv
import time
from typing import Optional, List

load_dotenv()

class AIService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY", "").strip()
        print(f"🔍 API Key loaded: {self.api_key[:15]}..." if self.api_key else "❌ No API key")
        self.model = None
        self.demo_mode = True
        self._setup_ai()
    
    def _setup_ai(self):
        if not self.api_key or self.api_key == "your-api-key-here":
            print("❌ DEMO MODE: No valid API key configured")
            return
        
        try:
            print("🔄 Configuring Gemini AI...")
            genai.configure(api_key=self.api_key)

            candidates = [
                "models/gemini-2.0-flash-001",
                "models/gemini-2.0-flash",
                "models/gemini-2.0-flash-lite",
                "models/gemini-pro-latest",
            ]
            for name in candidates:
                try:
                    print(f"🔄 Trying model: {name}")
                    self.model = genai.GenerativeModel(name)
                    test = self.model.generate_content("Now.")
                    print(f"✅ Model {name} working: '{test.text}'")
                    self.demo_mode = False
                    print(f"🎉 REAL AI MODE: Using {name}")
                    return
                except Exception as e:
                    print(f"❌ Model {name} failed: {e}")
            print("❌ All model attempts failed. Using demo mode.")
            self.demo_mode = True
        except Exception as e:
            print(f"❌ AI Setup failed: {e}")
            self.demo_mode = True

    # ---------- Scope / boundaries helpers (unchanged in spirit) ----------
    def _get_agent_boundaries(self, system_prompt: str) -> dict:
        p = system_prompt.lower()
        if any(k in p for k in ['hr', 'human resources', 'onboarding', 'employee']):
            return {
                "role": "HR Assistant",
                "allowed_topics": ["onboarding","benefits","policies","career development","company culture","time off","salary","training"],
                "out_of_scope_message": "I only handle HR topics (onboarding, benefits, policies, etc.). For payment/account issues, please contact Support.",
                "escalation_path": "Customer Support team",
            }
        elif any(k in p for k in ['payments','transaction','failed payment','transfer issue']):
            return {
                "role": "Payments Specialist",
                "allowed_topics": ["payment processing","failed payments","transfer tracking","transaction issues","refunds","verification"],
                "out_of_scope_message": "I only handle payment/transaction issues. For HR topics, contact HR.",
                "escalation_path": "HR department",
            }
        elif any(k in p for k in ['compliance','financial crime','kyc','aml','verification']):
            return {
                "role": "Compliance Specialist",
                "allowed_topics": ["verification","kyc","aml","sanctions","compliance checks","account limits"],
                "out_of_scope_message": "I only handle compliance/verification. For general payments, contact Support.",
                "escalation_path": "Customer Support team",
            }
        else:
            return {
                "role": "Customer Support Agent",
                "allowed_topics": ["transfers","fees","account setup","general questions","troubleshooting"],
                "out_of_scope_message": "I’m a general support agent. For specialized HR/compliance, I’ll direct you appropriately.",
                "escalation_path": "appropriate specialized team",
            }

    def _is_question_in_scope(self, user_query: str, boundaries: dict) -> bool:
        q = user_query.lower()
        if any(topic in q for topic in boundaries["allowed_topics"]):
            return True
        out_of_scope = {
            "HR Assistant": ["payment","transfer","fee","bank","transaction","refund"],
            "Payments Specialist": ["onboarding","benefits","salary","vacation","hr policy","employee"],
            "Compliance Specialist": ["onboarding","benefits","payment speed","transfer time","customer support"],
            "Customer Support Agent": [],
        }
        for k in out_of_scope.get(boundaries["role"], []):
            if k in q:
                return False
        return True

    # ---------- MAIN ENTRY POINT ----------
    def query_agent(
        self,
        user_query: str,
        system_prompt: str,
        company_name: Optional[str] = None,
        knowledge_text: Optional[str] = None,
    ) -> str:
        """
        Build a prompt that ONLY uses company knowledge (if provided).
        If no knowledge is available, the agent should say it doesn't have enough info.
        """
        start = time.time()
        boundaries = self._get_agent_boundaries(system_prompt)
        role = boundaries["role"]

        # Enforce scope
        if not self._is_question_in_scope(user_query, boundaries):
            if self.demo_mode:
                return f"🔒 **{role}**: {boundaries['out_of_scope_message']}"
            enforced = (
                f"You are a {role}. User asked: '{user_query}'. "
                f"This is out of scope. Politely direct them to {boundaries['escalation_path']}."
            )
            try:
                resp = self.model.generate_content(enforced)
                return resp.text
            except:
                return f"🔒 **{role}**: {boundaries['out_of_scope_message']}"

        # DEMO mode: return lightweight answer that references the company KB if present
        if self.demo_mode:
            if knowledge_text:
                return (
                    f"🤖 **{role}** (demo): Using **{company_name}** knowledge.\n\n"
                    f"**KB says:** {knowledge_text[:400]}...\n\n"
                    f"Your question: '{user_query}'. Based on the above, here’s a helpful answer."
                )
            else:
                return (
                    f"🤖 **{role}** (demo): I don’t have company knowledge to answer that. "
                    f"Please add knowledge for this company."
                )

        # REAL call
        try:
            kb_block = (
                f"COMPANY: {company_name}\n\n"
                f"COMPANY KNOWLEDGE (authoritative):\n{knowledge_text}\n\n"
                if knowledge_text else
                "NO COMPANY KNOWLEDGE PROVIDED.\n\n"
            )

            guardrails = (
                f"You are a {role}.\n\n"
                "RULES:\n"
                "1) Only use the 'COMPANY KNOWLEDGE' above. Do NOT invent facts.\n"
                "2) If the knowledge doesn’t contain the answer, say you don’t have enough info and suggest contacting a human.\n"
                "3) Stay within your allowed topics.\n\n"
                f"ALLOWED TOPICS: {', '.join(boundaries['allowed_topics'])}\n"
                f"OUT-OF-SCOPE HANDLING: {boundaries['out_of_scope_message']}\n\n"
            )

            full_prompt = (
                f"{guardrails}"
                f"{kb_block}"
                f"SYSTEM PROMPT:\n{system_prompt}\n\n"
                f"USER QUESTION:\n{user_query}\n\n"
                "YOUR ANSWER:"
            )

            resp = self.model.generate_content(
                full_prompt,
                generation_config=genai.types.GenerationConfig(
                    max_output_tokens=800,
                    temperature=0.7,
                    top_p=0.8
                )
            )
            elapsed = time.time() - start
            print(f"✅ {role} response in {elapsed:.2f}s")
            return resp.text

        except Exception as e:
            elapsed = time.time() - start
            print(f"❌ AI call failed after {elapsed:.2f}s: {e}")
            if knowledge_text:
                return (
                    f"⚠️ Temporary issue. Based on the company knowledge, here’s context you can use:\n\n"
                    f"{knowledge_text[:600]}..."
                )
            return "⚠️ Temporary issue and no company knowledge available."
        
    def query_public_agent(
        self,
        user_query: str,
        system_prompt: str,
        company_name: str,
        knowledge_text: Optional[str] = None,
    ) -> dict:
        """
        Special handling for public queries.
        Returns dict with response and whether email is needed.
        """
        if not knowledge_text:
            return {
                "response": "I don't have enough information about the company to answer that question. Please contact support for more details.",
                "requires_email": True
            }
        
        # Check if question is in knowledge
        query_lower = user_query.lower()
        knowledge_lower = knowledge_text.lower()
        
        # Simple keyword matching for demo
        important_keywords = ["price", "cost", "pricing", "fee", "plan", "subscription"]
        
        if any(keyword in query_lower for keyword in important_keywords):
            # Check if pricing info exists in knowledge
            if not any(pricing_word in knowledge_lower for pricing_word in 
                      ["price", "cost", "fee", "$", "usd", "plan"]):
                response = (
                    f"I don't have specific pricing information available. "
                    f"Would you like me to forward your question about pricing to our sales team?"
                )
                return {"response": response, "requires_email": True}
        
        # Use regular query method
        ai_response = self.query_agent(
            user_query=user_query,
            system_prompt=system_prompt,
            company_name=company_name,
            knowledge_text=knowledge_text
        )
        
        # Determine if response indicates lack of knowledge
        response_lower = ai_response.lower()
        uncertainty_phrases = [
            "don't know",
            "don't have",
            "not sure",
            "no information",
            "cannot answer",
            "unable to",
            "not provided",
            "lack of",
            "insufficient"
        ]
        
        requires_email = any(phrase in response_lower for phrase in uncertainty_phrases)
        
        return {
            "response": ai_response,
            "requires_email": requires_email
        }

# Singleton
ai_service = AIService()

