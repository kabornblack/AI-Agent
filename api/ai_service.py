# api/ai_service.py
import google.generativeai as genai
import os
from dotenv import load_dotenv
from typing import List
import time

load_dotenv()

class AIService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY", "").strip()
        print(f"🔍 API Key loaded: {self.api_key[:15]}..." if self.api_key else "❌ No API key")
        self.model = None
        self.demo_mode = True
        self._setup_ai()
    
    def _setup_ai(self):
        """Setup AI connection with correct model names"""
        if not self.api_key or self.api_key == "your-api-key-here":
            print("❌ DEMO MODE: No valid API key configured")
            return
        
        try:
            print("🔄 Configuring Gemini AI...")
            genai.configure(api_key=self.api_key)
            
            # Use the latest model names from your debug output
            available_models = [
                'models/gemini-2.0-flash-001',  # Primary choice - stable and fast
                'models/gemini-2.0-flash',      # Alternative
                'models/gemini-2.0-flash-lite', # Lightweight option
                'models/gemini-pro-latest'      # Fallback
            ]
            
            # Try each model until we find one that works
            for model_name in available_models:
                try:
                    print(f"🔄 Trying model: {model_name}")
                    self.model = genai.GenerativeModel(model_name)
                    
                    # Test the connection with a quick call
                    test_response = self.model.generate_content("Say 'AI is ready' in one word")
                    print(f"✅ Model {model_name} working: '{test_response.text}'")
                    
                    self.demo_mode = False
                    print(f"🎉 REAL AI MODE: Using {model_name}")
                    return
                    
                except Exception as model_error:
                    print(f"❌ Model {model_name} failed: {model_error}")
                    continue
            
            # If all models fail
            print("❌ All model attempts failed. Using demo mode.")
            self.demo_mode = True
                
        except Exception as e:
            print(f"❌ AI Setup failed: {str(e)}")
            self.demo_mode = True

    def _get_wise_knowledge_base(self):
        """Real Wise-specific knowledge for the AI to reference"""
        return {
            "transfer_speeds": {
                "instant": "Card payments: Usually within seconds for supported routes",
                "fast": "Digital wallets: 0-2 hours for Apple Pay/Google Pay",
                "standard": "Bank transfers: 1-2 business days for most routes"
            },
            "fees": "Typically 0.5% - 2% of transfer amount plus small fixed fee",
            "supported_countries": "80+ countries including US, UK, EU, Canada, Australia",
            "security": "Regulated by FCA, FinCEN, ASIC. Funds held in segregated accounts",
            "limits": "Personal: $50,000/day after verification. Business: Higher limits available",
            "verification": "Standard verification requires photo ID. Enhanced verification may require proof of address.",
            "currencies": "Supports 50+ currencies with real-time exchange rates",
            "features": "Multi-currency account, debit card, business accounts, batch payments"
        }

    def _get_hr_knowledge_base(self):
        """HR-specific knowledge for Wise"""
        return {
            "onboarding": "New hires complete digital onboarding, receive equipment, and attend orientation week. First week includes meet & greets with team leads.",
            "benefits": "Comprehensive health insurance, stock options, flexible PTO, £1,000 learning budget, 6 months parental leave, wellness stipend",
            "policies": "Remote-first culture, 4-day work trial for new hires, transparent salaries, direct feedback culture, no formal dress code",
            "locations": "Global offices in Tallinn, London, New York, Singapore, Budapest with flexible remote work options",
            "culture": "Mission-driven (money without borders), no ego, focus on customer impact, collaborative environment, weekly company updates",
            "development": "Regular performance conversations, promotion cycles twice per year, mentorship programs, internal mobility encouraged"
        }

    def _get_payments_knowledge_base(self):
        """Payments-specific knowledge for Wise"""
        return {
            "common_issues": "Payment delays usually due to: verification requirements, bank processing times, compliance checks, or incorrect recipient details",
            "failed_payments": "Check: sufficient funds, correct recipient details, account verification status, transfer limits, bank account status",
            "tracking": "Real-time tracking available in app with email/SMS notifications at each stage: processing, sent, funds received",
            "compliance": "All transfers screened for anti-money laundering and sanctions compliance. May require additional documentation for large amounts.",
            "refunds": "Failed payments automatically refunded in 3-5 business days to original payment method. Contact support if refund delayed.",
            "cutoff_times": "Transfers submitted before 2 PM local time typically process same day. Weekend transfers process next business day."
        }

    def _get_agent_boundaries(self, system_prompt: str) -> dict:
        """Define strict boundaries for each agent type"""
        prompt_lower = system_prompt.lower()
        
        if any(keyword in prompt_lower for keyword in ['hr', 'human resources', 'onboarding', 'employee']):
            return {
                "role": "HR Assistant",
                "allowed_topics": ["onboarding", "benefits", "policies", "career development", "company culture", "time off", "salary", "training"],
                "out_of_scope_message": "I specialize in HR topics like onboarding, benefits, and company policies. For payment or account questions, please contact our customer support team who can better assist you.",
                "escalation_path": "Customer Support team"
            }
        
        elif any(keyword in prompt_lower for keyword in ['payments', 'transaction', 'failed payment', 'transfer issue']):
            return {
                "role": "Payments Specialist", 
                "allowed_topics": ["payment processing", "failed payments", "transfer tracking", "transaction issues", "refunds", "verification"],
                "out_of_scope_message": "I specialize in payment and transaction issues. For HR or employee benefit questions, please contact our HR department.",
                "escalation_path": "HR department"
            }
        
        elif any(keyword in prompt_lower for keyword in ['compliance', 'financial crime', 'kyc', 'aml', 'verification']):
            return {
                "role": "Compliance Specialist",
                "allowed_topics": ["verification", "kyc", "aml", "sanctions", "compliance checks", "account limits"],
                "out_of_scope_message": "I specialize in compliance and verification processes. For general payment questions, please contact our customer support team.",
                "escalation_path": "Customer Support team"
            }
        
        else:  # Default to Customer Support
            return {
                "role": "Customer Support Agent",
                "allowed_topics": ["transfers", "fees", "account setup", "general questions", "troubleshooting"],
                "out_of_scope_message": "I specialize in general customer support. For specialized HR or compliance questions, I'll need to direct you to the appropriate team.",
                "escalation_path": "appropriate specialized team"
            }

    def _is_question_in_scope(self, user_query: str, boundaries: dict) -> bool:
        """Check if the question is within this agent's scope"""
        query_lower = user_query.lower()
        allowed_topics = boundaries["allowed_topics"]
        
        # Check if any allowed topic is mentioned in the query
        for topic in allowed_topics:
            if topic in query_lower:
                return True
        
        # Specific out-of-scope detection
        out_of_scope_keywords = {
            "HR Assistant": ["payment", "transfer", "fee", "bank", "transaction", "money send", "refund"],
            "Payments Specialist": ["onboarding", "benefits", "salary", "vacation", "hr policy", "employee"],
            "Compliance Specialist": ["onboarding", "benefits", "payment speed", "transfer time", "customer support"],
            "Customer Support Agent": []  # Customer support handles broad topics
        }
        
        agent_role = boundaries["role"]
        if agent_role in out_of_scope_keywords:
            for keyword in out_of_scope_keywords[agent_role]:
                if keyword in query_lower:
                    return False
        
        return True  # Default to in-scope for customer support

    def _get_knowledge_context(self, system_prompt: str) -> str:
        """Get relevant knowledge based on the agent type"""
        prompt_lower = system_prompt.lower()
        
        if any(keyword in prompt_lower for keyword in ['customer support', 'wise', 'transfer', 'money', 'bank']):
            wise_kb = self._get_wise_knowledge_base()
            return f"""
            
WISE KNOWLEDGE BASE:
- Transfer Speeds: {wise_kb['transfer_speeds']}
- Fees: {wise_kb['fees']}
- Supported Countries: {wise_kb['supported_countries']}
- Security: {wise_kb['security']}
- Account Limits: {wise_kb['limits']}
- Verification: {wise_kb['verification']}
- Features: {wise_kb['features']}
"""
        
        elif any(keyword in prompt_lower for keyword in ['hr', 'human resources', 'onboarding', 'employee', 'benefits']):
            hr_kb = self._get_hr_knowledge_base()
            return f"""
            
HR KNOWLEDGE BASE:
- Onboarding Process: {hr_kb['onboarding']}
- Employee Benefits: {hr_kb['benefits']}
- Company Policies: {hr_kb['policies']}
- Office Locations: {hr_kb['locations']}
- Company Culture: {hr_kb['culture']}
- Career Development: {hr_kb['development']}
"""
        
        elif any(keyword in prompt_lower for keyword in ['payments', 'transaction', 'failed payment', 'transfer issue']):
            payments_kb = self._get_payments_knowledge_base()
            return f"""
            
PAYMENTS KNOWLEDGE BASE:
- Common Issues: {payments_kb['common_issues']}
- Failed Payments: {payments_kb['failed_payments']}
- Transfer Tracking: {payments_kb['tracking']}
- Compliance Checks: {payments_kb['compliance']}
- Refund Process: {payments_kb['refunds']}
- Processing Times: {payments_kb['cutoff_times']}
"""
        
        elif any(keyword in prompt_lower for keyword in ['compliance', 'financial crime', 'kyc', 'aml', 'verification']):
            crime_kb = self._get_financial_crime_knowledge_base()
            return f"""
            
COMPLIANCE KNOWLEDGE BASE:
- KYC Requirements: {crime_kb['kyc_requirements']}
- AML Monitoring: {crime_kb['aml_checks']}
- Sanctions Screening: {crime_kb['sanctions']}
- Regulatory Reporting: {crime_kb['reporting']}
- Verification Timelines: {crime_kb['verification_times']}
"""
        
        return ""  # No specific knowledge base

    def create_agent(self, system_prompt: str, knowledge_texts: List[str] = None) -> str:
        """Create a new AI agent with a system prompt"""
        print(f"🤖 Creating agent with prompt: {system_prompt[:100]}...")
        if knowledge_texts:
            print(f"📚 Added {len(knowledge_texts)} knowledge documents")
        return system_prompt
    
    def query_agent(self, user_query: str, system_prompt: str, use_knowledge_base: bool = True) -> str:
        start_time = time.time()
        
        # Get agent boundaries first
        boundaries = self._get_agent_boundaries(system_prompt)
        agent_role = boundaries["role"]
        
        # Check if question is within this agent's scope
        if not self._is_question_in_scope(user_query, boundaries):
            if self.demo_mode:
                return f"🔒 **{agent_role}**: {boundaries['out_of_scope_message']}"
            else:
                # Even in real AI mode, enforce boundaries
                enforced_prompt = f"""You are a {agent_role} at Wise. 

Your role is strictly limited to: {', '.join(boundaries['allowed_topics'])}

A user has asked: "{user_query}"

This question is outside your area of expertise. Please politely direct them to the {boundaries['escalation_path']} and explain that you specialize in {', '.join(boundaries['allowed_topics'][:3])}.

Your response:"""
                
                try:
                    response = self.model.generate_content(enforced_prompt)
                    return response.text
                except:
                    return f"🔒 **{agent_role}**: {boundaries['out_of_scope_message']}"
        
        if self.demo_mode:
            response = self._get_instant_demo_response(user_query, system_prompt, boundaries)
            elapsed = time.time() - start_time
            print(f"⏱️ Demo response in {elapsed:.2f}s")
            return response
        
        try:
            print(f"🤖 Sending to {agent_role}: '{user_query[:50]}...'")
            
            # Get relevant knowledge based on the system prompt
            knowledge_context = ""
            if use_knowledge_base:
                knowledge_context = self._get_knowledge_context(system_prompt)
            
            # Build the enhanced prompt with role enforcement
            full_prompt = f"""You are a {agent_role} at Wise. Follow these instructions carefully:

SYSTEM ROLE: {system_prompt}
{knowledge_context}

IMPORTANT: You must stay strictly within your role as {agent_role}. Only answer questions about: {', '.join(boundaries['allowed_topics'])}.

USER QUESTION: {user_query}

Please provide a helpful, accurate response that follows your system role instructions and stays within your expertise:"""
            
            response = self.model.generate_content(
                full_prompt,
                generation_config=genai.types.GenerationConfig(
                    max_output_tokens=800,
                    temperature=0.7,
                    top_p=0.8
                )
            )
            
            elapsed = time.time() - start_time
            print(f"✅ {agent_role} response in {elapsed:.2f}s")
            return response.text
            
        except Exception as e:
            elapsed = time.time() - start_time
            print(f"❌ AI call failed after {elapsed:.2f}s: {e}")
            return self._get_instant_demo_response(user_query, system_prompt, boundaries)

    def _get_instant_demo_response(self, user_query: str, system_prompt: str, boundaries: dict = None) -> str:
        """Smart demo responses with strict role enforcement"""
        if boundaries is None:
            boundaries = self._get_agent_boundaries(system_prompt)
        
        agent_role = boundaries["role"]
        query_lower = user_query.lower()
        
        # First check if this is out of scope
        if not self._is_question_in_scope(user_query, boundaries):
            return f"🔒 **{agent_role}**: {boundaries['out_of_scope_message']}"
        
        # Role-specific responses
        hr_responses = {
            "onboarding": "The onboarding process takes about 2 weeks and includes digital setup, equipment delivery, orientation sessions, and team introductions. You'll be assigned a buddy to help you settle in.",
            "benefits": "We offer comprehensive benefits: health/dental/vision insurance, stock options, flexible PTO, £1,000 annual learning budget, 6 months parental leave, and wellness programs.",
            "policy": "Our remote-first culture emphasizes transparency, direct feedback, and work-life balance. We have transparent salaries and encourage taking time off when needed.",
            "vacation": "We have a flexible PTO policy - take time as needed when coordinated with your team. We encourage minimum 21 days off per year.",
            "salary": "Wise practices transparent compensation with regular market adjustments. Salaries are based on role, experience level, and location bands.",
            "culture": "We're mission-driven to create money without borders. Our values include no ego, customer impact, and team collaboration. We have weekly all-hands meetings.",
            "development": "We have bi-annual promotion cycles, regular performance conversations, mentorship programs, and support internal mobility and skill development."
        }
        
        payments_responses = {
            "failed": "Check: 1) Sufficient funds in your account 2) Correct recipient details 3) Your verification status 4) Transfer limits. Failed payments auto-refund in 3-5 days.",
            "tracking": "You can track transfers in real-time via the app. We send notifications at each stage: processing, sent, funds received, completed.",
            "delay": "Delays can occur due to verification, bank processing times, or compliance checks. Most transfers complete within the estimated timeframe.",
            "refund": "Failed payments are automatically refunded to your original payment method within 3-5 business days. Contact support if not received after 5 days.",
            "verification": "Standard verification requires a government ID and takes 1-2 days. Enhanced verification may need proof of address for higher limits.",
            "limit": "Personal accounts: $2,000/day unverified, $50,000/day verified. Business accounts have higher limits based on business size and needs."
        }
        
        customer_support_responses = {
            "transfer": "We offer instant transfers with cards (seconds), fast transfers with digital wallets (0-2 hours), and standard bank transfers (1-2 days).",
            "fee": "Fees are typically 0.5%-2% of the amount plus a small fixed fee. You see the total cost upfront before confirming any transfer.",
            "safe": "Wise is regulated by financial authorities globally. Customer funds are held in segregated accounts at major banks with bank-level security.",
            "country": "We support 80+ countries including US, UK, EU, Canada, Australia, and many more. Check our website for specific country availability.",
            "account": "You can open a multi-currency account to hold 50+ currencies, get a debit card, and manage international payments all in one place."
        }
        
        # Get responses based on agent role
        if agent_role == "HR Assistant":
            for key, response in hr_responses.items():
                if key in query_lower:
                    return f"💼 **{agent_role}**: {response}"
            return f"""💼 **{agent_role} Demo**: I understand you're asking about HR topics.

I specialize in:
• Employee onboarding and orientation
• Benefits and compensation
• Company policies and culture
• Career development and training
• Workplace guidelines

What specific HR question can I help you with?"""
        
        elif agent_role == "Payments Specialist":
            for key, response in payments_responses.items():
                if key in query_lower:
                    return f"💳 **{agent_role}**: {response}"
            return f"""💳 **{agent_role} Demo**: I understand you're asking about payment issues.

I specialize in:
• Payment processing and tracking
• Failed payment troubleshooting
• Transfer verification
• Account limits and compliance
• Refund processes

What specific payment issue can I assist with?"""
        
        else:  # Customer Support Agent
            for key, response in customer_support_responses.items():
                if key in query_lower:
                    return f"🤖 **{agent_role}**: {response}"
            return f"""🤖 **{agent_role} Demo**: I understand you're asking about "{user_query}".

I can help with:
• International money transfers and fees
• Account setup and verification
• Transfer tracking and timing
• Security and safety questions
• General Wise services

What specific service can I help you with today?"""

# Singleton instance
ai_service = AIService()