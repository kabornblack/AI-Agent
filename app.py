# app.py - Main file for Streamlit Cloud Deployment
import streamlit as st
import requests
import os
from dotenv import load_dotenv
from functools import lru_cache
import json
from pathlib import Path

load_dotenv()

# Read admin configuration from environment variables
ADMIN_EMAILS = [email.strip() for email in os.getenv("ADMIN_EMAILS", "").split(",") if email.strip()]
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")

# --------------------------
# BASE CONFIG
# --------------------------
API_BASE = os.environ.get('API_BASE_URL', 'http://127.0.0.1:8000/api/v1')

# --------------------------
# CACHED API HELPER
# --------------------------
@st.cache_data(ttl=15)
def get_companies_cached(token: str):
    """Cache company data for 15 seconds"""
    headers = {"Authorization": f"Bearer {token}"}
    res = requests.get(f"{API_BASE}/companies", headers=headers)
    return res.json() if res.status_code == 200 else []

@st.cache_data(ttl=15)
def get_company_agents_cached(company_id: int, token: str):
    """Cache agent list for a specific company"""
    headers = {"Authorization": f"Bearer {token}"}
    res = requests.get(f"{API_BASE}/companies/{company_id}/agents", headers=headers)
    return res.json() if res.status_code == 200 else []

@st.cache_data(ttl=15)
def get_company_users_cached(company_id: int, token: str):
    """Cache user list for a specific company"""
    headers = {"Authorization": f"Bearer {token}"}
    res = requests.get(f"{API_BASE}/companies/{company_id}/users", headers=headers)
    return res.json() if res.status_code == 200 else []


st.set_page_config(
    page_title="AI Agent Builder - Plug & Play",
    page_icon="🤖",
    layout="wide"
)

SESSION_FILE = Path("auth_state.json")

# --------------------------
# SESSION INIT
# --------------------------
if 'agent_created' not in st.session_state:
    st.session_state.agent_created = False

if 'company_name' not in st.session_state:
    st.session_state.company_name = None

# --------------------------
# SAVE & LOAD SESSION STATE
# --------------------------
def save_session_state():
    """Save token and company info persistently."""
    data = {}
    if "token" in st.session_state:
        data["token"] = st.session_state["token"]
    if "company_name" in st.session_state:
        data["company_name"] = st.session_state["company_name"]
    if "is_admin" in st.session_state:
        data["is_admin"] = st.session_state["is_admin"]
    if "company_role" in st.session_state:
        data["company_role"] = st.session_state["company_role"]
    SESSION_FILE.write_text(json.dumps(data))


def load_session_state():
    """Load token and company info if they exist."""
    if SESSION_FILE.exists():
        try:
            data = json.loads(SESSION_FILE.read_text())
            if "token" in data:
                st.session_state["token"] = data["token"]
            if "company_name" in data:
                st.session_state["company_name"] = data["company_name"]
            if "is_admin" in data:
                st.session_state["is_admin"] = data["is_admin"]
            if "company_role" in data:
                st.session_state["company_role"] = data["company_role"]
        except Exception:
            pass


def initialize_company_data():
    """Fetch and cache company data and user role after token load"""
    if "companies_data" in st.session_state and st.session_state["companies_data"]:
        return  # already loaded

    headers = get_headers()
    if not headers:
        return

    try:
        res = requests.get(f"{API_BASE}/companies", headers=headers)
        if res.status_code == 200:
            companies = res.json()
            st.session_state["companies_data"] = companies
            if companies:
                first_company = companies[0]
                st.session_state["company_name"] = first_company.get("name")
                st.session_state["company_role"] = first_company.get("role", "member")
            else:
                st.session_state["company_name"] = None
                st.session_state["company_role"] = "member"
        else:
            st.session_state["companies_data"] = []
            st.session_state["company_role"] = "member"
    except Exception:
        st.session_state["companies_data"] = []
        st.session_state["company_role"] = "member"


def clear_session_state():
    """Clear session and delete file."""
    if SESSION_FILE.exists():
        SESSION_FILE.unlink()
    st.session_state.clear()
    # load_session_state()
   

# --------------------------
# AUTH HELPERS
# --------------------------
def login(email, password):
    """Login existing user, store JWT, and save context"""
    try:
        normalized_email = email.strip().lower()
        admin_emails_normalized = {e.strip().lower() for e in ADMIN_EMAILS}

        # Check if this is a platform admin email
        is_platform_admin = normalized_email in admin_emails_normalized

        if is_platform_admin:
            print("Using admin login endpoint")
            res = requests.post(
                f"{API_BASE}/auth/admin-login",
                json={"email": normalized_email, "password": password},
                timeout=10
            )
        else:
            print("Using regular login endpoint")
            res = requests.post(
                f"{API_BASE}/auth/login",
                json={"email": email, "password": password},
                timeout=10
            )

        print(f"Response status: {res.status_code}")
        if res.status_code != 200:
            print(f"Response content: {res.text}")

        if res.status_code == 200:
            data = res.json()
            token = data["access_token"]
            st.session_state["token"] = token
            st.session_state["user_id"] = data.get("user_id")
            st.session_state["is_admin"] = data.get("is_admin", False)

            # ✅ Skip any redundant company fetching here
            # The company name and role will be loaded by initialize_company_data() after rerun
            st.session_state["company_name"] = None

            save_session_state()
            return True
        else:
            error_detail = res.json().get("detail", "Login failed")
            st.error(f"❌ {error_detail}")
            return False

    except Exception as e:
        st.error(f"Error connecting to API: {e}")
        return False


def register_company(email, password, company_name):
    """Register a company and user"""
    try:
        res = requests.post(
            f"{API_BASE}/auth/register-company",
            params={"company_name": company_name},
            json={"email": email, "password": password}
        )
        if res.status_code == 200:
            st.success("✅ Company and user registered successfully! You can now log in.")
        else:
            st.error(res.json().get("detail", "Registration failed"))
    except Exception as e:
        st.error(f"Error connecting to API: {e}")


def get_headers():
    """Return headers with JWT"""
    if "token" in st.session_state:
        return {"Authorization": f"Bearer {st.session_state['token']}"}
    return {}

# --------------------------
# LOGIN / SIGNUP PAGE
# --------------------------
def login_page():
    st.title("🔐 Login or Register")

    tab1, tab2 = st.tabs(["Login", "Register Company"])

    # --- LOGIN TAB ---
    with tab1:
        st.subheader("Login to your account")
        email = st.text_input("Email", key="login_email")
        password = st.text_input("Password", type="password", key="login_password")
        
        # Show admin hint (with case-insensitive check)
        normalized_email = email.strip().lower() if email else ""
        admin_emails_normalized = {e.strip().lower() for e in ADMIN_EMAILS}
        
        if normalized_email in admin_emails_normalized:
            st.info("🛡️ Platform admin detected. Use the shared admin password.")
        
        if st.button("Login", key="login_btn"):
            if login(email, password):
                st.success("✅ Logged in successfully!")
                st.rerun()

    # --- REGISTER TAB ---
    with tab2:
        st.subheader("Register your Company")
        company_name = st.text_input("Company Name", key="register_company")
        reg_email = st.text_input("Work Email", key="register_email")
        reg_password = st.text_input("Password", type="password", key="register_password")
        
        # Show warning if trying to register admin email (case-insensitive)
        normalized_reg_email = reg_email.strip().lower() if reg_email else ""
        if normalized_reg_email in admin_emails_normalized:
            st.warning("🛡️ This email is for platform admin access. Use the login tab instead.")
        
        if st.button("Register Company", key="register_btn"):
            if not company_name or not reg_email or not reg_password:
                st.error("All fields are required.")
            elif normalized_reg_email in admin_emails_normalized:
                st.error("Admin emails cannot register companies. Use the login tab.")
            else:
                register_company(reg_email, reg_password, company_name)


    # ========================
    #  PAGE HANDLING
    # ========================
def create_agent_page(role):
    st.header("Create New AI Agent")

    # 🔒 Restrict non-admins
    if role not in ["owner", "admin"]:
        st.info("🔒 You don't have permission to create agents.")
        return

    # ✅ Ensure company_name is set before continuing
    if not st.session_state.get("company_name"):
        with st.spinner("Loading company info..."):
            companies = get_companies_cached(st.session_state["token"])
            if companies:
                st.session_state["company_name"] = companies[0]["name"]
            else:
                st.warning("⚠️ No companies found.")

    # ✅ Initialize show_knowledge in session state if not present
    if "show_knowledge" not in st.session_state:
        st.session_state.show_knowledge = True

    # ✅ Always check live company data (no session storage)
    with st.spinner("Fetching latest company data..."):
        companies = get_companies_cached(st.session_state["token"])
        company = next((c for c in companies if c["name"] == st.session_state.get("company_name")), None)

        if company:
            fetched_role = company.get("role", role)
            if fetched_role and fetched_role != role:
                role = fetched_role

            # 🧠 PERMANENTLY hide knowledge section if company already has knowledge
            st.session_state.show_knowledge = not (
                company.get("knowledge") and company["knowledge"].get("knowledge_text")
            )
        else:
            st.warning("⚠️ Could not find matching company.")


    # 🧹 Auto-clear fields if flagged from last run
    if st.session_state.get("clear_form", False):
        for key in ["agent_name", "agent_description", "agent_system_prompt", "knowledge_text"]:
            if key in st.session_state:
                del st.session_state[key]
        st.session_state.clear_form = False
        st.rerun()

    # ✅ Show persistent success message if agent was created
    if "agent_created_message" in st.session_state:
        st.success(st.session_state.agent_created_message)

    # 🧩 Agent creation form
    with st.form("create_agent_form_unique"):
        st.subheader("Agent Details")
        name = st.text_input("Agent Name", placeholder="e.g., Customer Support Expert", key="agent_name")
        description = st.text_area("Description", placeholder="What does this agent do?", key="agent_description")
        system_prompt = st.text_area(
            "System Prompt",
            height=150,
            placeholder="You are a helpful customer support agent...",
            key="agent_system_prompt"
        )

        st.divider()

        # ✅ Show or hide knowledge upload strictly based on backend - USING SESSION STATE
        if st.session_state.show_knowledge:
            st.subheader("Knowledge Base")
            st.markdown("Upload documents or add text that your agent should reference")
            knowledge_files = st.file_uploader("Upload documents", type=['txt', 'pdf'], accept_multiple_files=True)
            knowledge_text = st.text_area("Or paste text knowledge", height=100, key="knowledge_text")
        else:
            st.info("🧠 This company already has a knowledge base. You can manage or update it from 'Manage Agents'.")
            knowledge_files = []
            knowledge_text = ""

        submitted = st.form_submit_button("Create Agent")

        if submitted:
            company_name = (st.session_state.get("company_name") or "").strip()

            if not name or not system_prompt:
                st.error("Agent Name and System Prompt are required!")
            elif not company_name:
                st.warning("You don't appear to belong to any company yet. Please register a company first or contact your admin.")
            else:
                # Only include knowledge if the section was shown
                knowledge_texts = [knowledge_text] if knowledge_text and st.session_state.show_knowledge else []
                
                # Handle file uploads if knowledge section was shown
                if st.session_state.show_knowledge and knowledge_files:
                    # Add your file processing logic here
                    pass
                
                agent_data = {
                    "name": name,
                    "description": description,
                    "system_prompt": system_prompt,
                    "company_name": company_name,
                    "knowledge_texts": knowledge_texts,
                }

                try:
                    response = requests.post(f"{API_BASE}/agents/", json=agent_data, headers=get_headers())
                    if response.status_code == 200:
                        st.session_state.agent_created_message = f"✅ Agent '{name}' created successfully for '{company_name}'!"
                        st.success(st.session_state.agent_created_message)
                        st.session_state.agent_created = True
                        # Set flag to clear form on next run
                        st.session_state.clear_form = True
                        st.rerun()
                    elif response.status_code == 400:
                        st.error(f"❌ {response.json().get('detail', 'Unknown error')}")
                    else:
                        st.error(f"Failed to create agent: {response.text}")
                except Exception as e:
                    st.error(f"Error connecting to API: {e}")

    # ========================
    # MANAGE AGENTS PAGE
    # ========================

def manage_agents_page(role):
    st.header("Manage Companies & Agents")
    st.caption("View, edit, and manage your company's AI agents and knowledge base.")

    try:
        with st.spinner("Loading companies..."):
            companies = get_companies_cached(st.session_state["token"])

        if not companies:
            st.info("No companies created yet.")
            return

        for company in companies:
            with st.container():
                st.markdown("---")
                st.subheader(f"🏢 {company['name']}")
                st.caption(f"📅 Created at: {company['created_at']}")


                # ----------------------------
                # 🧠 Company Knowledge (Professional Version - No Double Click)
                # ----------------------------
                st.markdown("### 🧠 Company Knowledge")

                knowledge = company.get("knowledge")
                if knowledge:
                    knowledge_text = knowledge.get("knowledge_text", "")

                    st.write(knowledge_text[:500] + ("..." if len(knowledge_text) > 500 else ""))

                    # Owners/Admins can edit
                    if role in ["owner", "admin"]:
                        # State keys
                        edit_flag_key = f"kb_editing_{company['id']}"
                        editor_key = f"kb_editor_{company['id']}"
                        
                        # Initialize edit mode if not set
                        if edit_flag_key not in st.session_state:
                            st.session_state[edit_flag_key] = False

                        # Callback functions for immediate state changes
                        def enable_edit_mode():
                            st.session_state[edit_flag_key] = True

                        def disable_edit_mode():
                            st.session_state[edit_flag_key] = False

                        def save_knowledge():
                            new_text = st.session_state.get(editor_key, "").strip()
                            if not new_text:
                                st.warning("⚠️ Knowledge cannot be empty.")
                                return
                            
                            with st.spinner("Updating knowledge..."):
                                resp = requests.put(
                                    f"{API_BASE}/companies/{company['id']}/knowledge",
                                    json={"knowledge_text": new_text},
                                    headers=get_headers()
                                )
                                if resp.status_code == 200:
                                    get_companies_cached.clear()
                                    st.session_state[edit_flag_key] = False
                                    st.success("✅ Knowledge updated successfully!")
                                else:
                                    st.error(f"Failed: {resp.text}")

                        # If NOT editing, show 'Edit' button
                        if not st.session_state[edit_flag_key]:
                            st.button("✏️ Edit Knowledge", key=f"kb_edit_btn_{company['id']}", on_click=enable_edit_mode)

                        # If editing, show textarea + Save/Cancel
                        else:
                            st.text_area(
                                "Update Knowledge Base",
                                value=knowledge_text,
                                key=editor_key,
                                height=180
                            )

                            col_save, col_cancel = st.columns([1, 1])
                            with col_save:
                                st.button("💾 Save", key=f"kb_save_{company['id']}", type="primary", on_click=save_knowledge)
                            
                            with col_cancel:
                                st.button("❌ Cancel", key=f"kb_cancel_{company['id']}", on_click=disable_edit_mode)
                    else:
                        st.info("🔒 You don't have permission to edit knowledge.")
                else:
                    st.warning("No knowledge base found for this company yet.")


                # ----------------------------
                # 🗑️ Delete Company (Owner only)
                # ----------------------------
                if role == "owner":
                    del_company_key = f"confirm_delete_company_{company['id']}"
                    if st.session_state.get(del_company_key, False):
                        st.error(f"⚠️ Are you sure you want to permanently delete '{company['name']}'?")
                        col_c1, col_c2 = st.columns([1, 1])
                        with col_c1:
                            if st.button("✅ Confirm Delete", key=f"ok_company_{company['id']}"):
                                try:
                                    resp = requests.delete(
                                        f"{API_BASE}/companies/{company['id']}",
                                        headers=get_headers()
                                    )
                                    if resp.status_code == 200:
                                        st.success("✅ Company deleted successfully!")
                                        get_companies_cached.clear()
                                        del st.session_state[del_company_key]
                                    else:
                                        st.error(f"❌ Failed: {resp.text}")
                                except Exception as e:
                                    st.error(f"Error: {e}")
                        with col_c2:
                            if st.button("❌ Cancel", key=f"cancel_company_{company['id']}"):
                                del st.session_state[del_company_key]
                    else:
                        if st.button(f"🗑️ Delete Company '{company['name']}'", key=f"del_company_{company['id']}"):
                            st.session_state[del_company_key] = True

                st.divider()

                # ----------------------------
                # 🤖 Agents Section
                # ----------------------------
                st.markdown("### 🤖 Agents")
                agents = company.get("agents", [])
                if not agents:
                    st.info("No agents created yet.")
                    continue

                for agent in agents:
                    with st.container():
                        st.markdown(f"#### 🤖 {agent['name']}")
                        st.caption(f"🕓 Created at: {agent['created_at']}")
                        st.markdown(f"**Description:** {agent['description'] or '_No description provided_'}")
                        st.markdown(f"**Prompt:** {agent['system_prompt'] or '_No prompt set_'}")

                        # 🗨️ Conversations
                        with st.expander("Recent Conversations"):
                            with st.spinner("Loading..."):
                                conv_resp = requests.get(
                                    f"{API_BASE}/agents/{agent['id']}/conversations",
                                    headers=get_headers()
                                )
                                if conv_resp.status_code == 200:
                                    convs = conv_resp.json()
                                    if convs:
                                        for conv in convs[:3]:
                                            st.markdown(f"**Q:** {conv['user_query']}")
                                            st.markdown(f"**A:** {conv['agent_response'][:300]}...")
                                            st.markdown("---")
                                            # st.markdown("<hr style='margin:9rem 0;'>", unsafe_allow_html=True)
                                    else:
                                        st.info("No conversations found.")
                                else:
                                    st.error("Failed to load conversations.")

                        # 🗑️ Delete Agent (Owner/Admin)
                        if role in ["owner", "admin"]:
                            del_agent_key = f"confirm_delete_agent_{agent['id']}"
                            if st.session_state.get(del_agent_key, False):
                                st.error(f"⚠️ Confirm delete agent '{agent['name']}'?")
                                col_a1, col_a2 = st.columns([1, 1])
                                with col_a1:
                                    if st.button("✅ Confirm", key=f"ok_agent_{agent['id']}"):
                                        try:
                                            resp = requests.delete(
                                                f"{API_BASE}/agents/{agent['id']}",
                                                headers=get_headers()
                                            )
                                            if resp.status_code == 200:
                                                st.success(f"✅ Agent '{agent['name']}' deleted!")
                                                get_companies_cached.clear()
                                                del st.session_state[del_agent_key]
                                            else:
                                                st.error(f"❌ Failed: {resp.text}")
                                        except Exception as e:
                                            st.error(f"Error: {e}")
                                with col_a2:
                                    if st.button("❌ Cancel", key=f"cancel_agent_{agent['id']}"):
                                        del st.session_state[del_agent_key]
                            else:
                                if st.button(f"🗑️ Delete Agent '{agent['name']}'", key=f"del_agent_{agent['id']}"):
                                    st.session_state[del_agent_key] = True
                        else:
                            st.info("🔒 You don’t have permission to delete agents.")

    except Exception as e:
        st.error(f"Error: {e}")


    # ========================
    # CHAT WITH AGENT PAGE
    # ========================
def chat_page():
    """Chat page for chatting with company agents"""
    st.header("💬 Chat with Your Company Agents")

    try:
        # ✅ Fetch companies using cached API call
        with st.spinner("Loading agents..."):
            companies = get_companies_cached(st.session_state["token"])

        # 🏢 No companies
        if not companies:
            st.info("No companies found. Please create one first.")
            return

        # 🧭 Company selection
        company_names = [c['name'] for c in companies]
        selected_company = st.selectbox("Select Company", company_names)
        company_data = next((c for c in companies if c['name'] == selected_company), None)

        if not company_data:
            st.warning("⚠️ Unable to find selected company.")
            return

        # 🤖 Agents under the company
        agents = company_data.get("agents", [])
        if not agents:
            st.warning("This company has no agents yet.")
            return

        # 🎯 Agent selection
        agent_names = [f"{a['id']}: {a['name']}" for a in agents]
        selected_agent = st.selectbox("Select an Agent", agent_names)
        agent_id = int(selected_agent.split(":")[0])
        selected_agent_details = next((a for a in agents if a['id'] == agent_id), None)

        if not selected_agent_details:
            st.warning("⚠️ Could not find agent details.")
            return

        # 🧠 Agent description and input field
        st.info(f"**Role:** {selected_agent_details['description']}")
        user_query = st.text_input("Your question:")

        # 💬 Send user query
        if st.button("Send") and user_query.strip():
            with st.spinner("Thinking..."):
                query_data = {"agent_id": agent_id, "user_query": user_query.strip()}
                response = requests.post(f"{API_BASE}/query/", json=query_data, headers=get_headers())

                if response.status_code == 200:
                    result = response.json()
                    st.markdown("### 🧠 Agent Response")
                    st.write(result['response'])
                else:
                    st.error(f"Failed to get response: {response.text}")

    except Exception as e:
        st.error(f"Error connecting to API: {e}")


def manage_users_page(role):
    st.header("👥 Manage Company Users")

    # ✅ Show persistent success message if it exists
    if "user_created_message" in st.session_state:
        st.success(st.session_state["user_created_message"])
        del st.session_state["user_created_message"]

    # 🔒 Access control
    if role not in ["owner", "admin"]:
        st.warning("🔒 You don’t have permission to manage users.")
        return

    try:
        # Get current company
        companies_response = requests.get(f"{API_BASE}/companies", headers=get_headers())
        if companies_response.status_code != 200:
            st.error("Failed to load company info.")
            return

        companies = companies_response.json()
        if not companies:
            st.info("No companies found.")
            return

        company = companies[0]  # current user's company
        st.subheader(f"🏢 {company['name']}")

        st.divider()
        st.markdown("### ➕ Add a new team member")

        # 🔹 Invite new member form
        with st.form("invite_user_form"):
            email = st.text_input("New User Email")
            password = st.text_input("Temporary Password", type="password")
            role_choice = st.selectbox("Role", ["member", "admin"])
            submitted = st.form_submit_button("Invite User")

            if submitted:
                if not email or not password:
                    st.error("Email and password are required.")
                else:
                    payload = {"email": email, "password": password, "role": role_choice}
                    try:
                        resp = requests.post(
                            f"{API_BASE}/companies/{company['id']}/invite",
                            json=payload,
                            headers=get_headers()
                        )
                        if resp.status_code == 200:
                            st.session_state["user_created_message"] = f"✅ {email} added successfully as {role_choice}!"
                            # st.rerun()
                        else:
                            st.error(resp.json().get("detail", resp.text))
                    except Exception as e:
                        st.error(f"Error adding user: {e}")

        # 🔹 List all company users
        st.divider()
        st.markdown("### 👥 Current Team Members")

        try:
            with st.spinner("Loading users..."):
                users = get_company_users_cached(company["id"], st.session_state["token"])

            if not users:
                st.info("No users found for this company yet.")
            else:
                for u in users:
                    col1, col2, col3, col4 = st.columns([3, 2, 2, 1])
                    with col1:
                        st.markdown(f"**{u['email']}**")
                    with col2:
                        st.markdown(f"Role: `{u['role']}`")
                    with col3:
                        created = u.get("created_at", "").split("T")[0] if u.get("created_at") else ""
                        st.markdown(f"Joined: {created}")
                    with col4:
                        # 🔒 Owner can delete anyone except other owners
                        if role == "owner" and u["role"] != "owner":
                            confirm_key = f"confirm_delete_{u['id']}"
                            if st.session_state.get(confirm_key, False):
                                st.warning(f"⚠️ **{u['email']}**?")
                                col_ok, col_cancel = st.columns(2)
                                with col_ok:
                                    if st.button("✅", key=f"ok_{u['id']}"):
                                        try:
                                            del_resp = requests.delete(
                                                f"{API_BASE}/companies/{company['id']}/users/{u['id']}",
                                                headers=get_headers()
                                            )
                                            if del_resp.status_code == 200:
                                                get_company_users_cached.clear()
                                                st.session_state["user_created_message"] = f"❌ {u['email']} removed successfully!"
                                                del st.session_state[confirm_key]
                                                st.rerun()
                                            else:
                                                st.error(f"Failed: {del_resp.text}")
                                        except Exception as e:
                                            st.error(f"Error: {e}")
                                with col_cancel:
                                    if st.button("❌", key=f"cancel_{u['id']}"):
                                        del st.session_state[confirm_key]
                                        st.rerun()
                            else:
                                if st.button("🗑️", key=f"del_user_{u['id']}"):
                                    st.session_state[confirm_key] = True
                                    st.rerun()

                        # 🔒 Admin can delete only members
                        elif role == "admin" and u["role"] == "member":
                            confirm_key = f"confirm_delete_{u['id']}"
                            if st.session_state.get(confirm_key, False):
                                st.warning(f"⚠️ **{u['email']}**?")
                                col_ok, col_cancel = st.columns(2)
                                with col_ok:
                                    if st.button("✅", key=f"ok_{u['id']}"):
                                        try:
                                            del_resp = requests.delete(
                                                f"{API_BASE}/companies/{company['id']}/users/{u['id']}",
                                                headers=get_headers()
                                            )
                                            if del_resp.status_code == 200:
                                                get_company_users_cached.clear()
                                                st.session_state["user_created_message"] = f"❌ {u['email']} removed successfully!"
                                                del st.session_state[confirm_key]
                                                st.rerun()
                                            else:
                                                st.error(f"Failed: {del_resp.text}")
                                        except Exception as e:
                                            st.error(f"Error: {e}")
                                with col_cancel:
                                    if st.button("❌", key=f"cancel_{u['id']}"):
                                        del st.session_state[confirm_key]
                                        st.rerun()
                            else:
                                if st.button("🗑️", key=f"del_user_{u['id']}"):
                                    st.session_state[confirm_key] = True
                                    st.rerun()
                        else:
                            st.markdown("—")
        except Exception as e:
            st.error(f"Error loading users: {e}")

    except Exception as e:
        st.error(f"Error: {e}")


    # ========================
    # ADMIN PREV
    # ========================
def admin_dashboard_page():
    """Platform Admin Dashboard — view and manage all companies"""
    st.title("🛡️ Platform Admin Dashboard")
    st.caption("Full system overview and company management")

    try:
        # --- Fetch all data ---
        resp = requests.get(f"{API_BASE}/debug/all-data", headers=get_headers())
        if resp.status_code != 200:
            st.error(f"Failed to load admin data: {resp.text}")
            return

        data = resp.json()
        companies = data.get("companies", [])
        users = data.get("users", [])

        # --- Summary Metrics ---
        col1, col2 = st.columns(2)
        with col1:
            st.metric("🏢 Total Companies", len(companies))
        with col2:
            st.metric("👥 Total Users", len(users))

        st.divider()

        # --- Company List ---
        st.subheader("All Registered Companies")
        if not companies:
            st.info("No companies found.")
            return

        for c in companies:
            with st.container():
                st.markdown(f"### 🏢 {c['name']} (ID: {c['id']})")
                st.caption(f"📅 Created at: {c['created_at']}")
                st.markdown(f"**Agents:** {len(c.get('agents', []))}")
                st.markdown(f"**Members:** {len(c.get('members', []))}")

                # --- ⚡ Instant Delete Logic ---
                confirm_key = f"confirm_delete_company_{c['id']}"

                # 🗑️ Step 1: Normal delete button
                if not st.session_state.get(confirm_key):
                    if st.button(f"🗑️ Delete Company '{c['name']}'", key=f"delete_btn_{c['id']}"):
                        # Show confirmation instantly (no rerun)
                        st.session_state[confirm_key] = True

                # ⚠️ Step 2: Show confirmation instantly
                if st.session_state.get(confirm_key):
                    st.warning(f"⚠️ Are you sure you want to permanently delete **{c['name']}**?")
                    col1, col2 = st.columns(2)

                    with col1:
                        if st.button("✅ Confirm Delete", key=f"confirm_yes_{c['id']}"):
                            with st.spinner("Deleting company..."):
                                try:
                                    delete_resp = requests.delete(
                                        f"{API_BASE}/admin/companies/{c['id']}",
                                        headers=get_headers()
                                    )
                                    if delete_resp.status_code == 200:
                                        st.success("✅ Company deleted successfully.")
                                        get_companies_cached.clear()  # refresh cache
                                        del st.session_state[confirm_key]
                                        st.rerun()
                                    else:
                                        st.error(f"❌ {delete_resp.text}")
                                except Exception as e:
                                    st.error(f"Error deleting company: {e}")

                    with col2:
                        if st.button("❌ Cancel", key=f"cancel_delete_{c['id']}"):
                            del st.session_state[confirm_key]

                # st.markdown("---")
                st.markdown("<hr style='margin:0.1rem 0;'>", unsafe_allow_html=True)

    except Exception as e:
        st.error(f"Error loading admin data: {e}")


# --------------------------
# MAIN APP DASHBOARD
# --------------------------
def main_app():
    if not st.session_state.get("is_admin", False):
        st.title("🤖 AI Agent Builder - Plug & Play")
        st.markdown("Create your own AI agents in minutes!")

    # ✅ Cache the company role so it never resets mid-session
    if "company_role" not in st.session_state:
        st.session_state["company_role"] = "member"

    # 🔹 Display role info at the top
    is_platform_admin = st.session_state.get("is_admin", False)
    role = st.session_state.get("company_role", "member")

    if not is_platform_admin:
        if role == "owner":
            st.success("👑 You are the **Company Owner**.")
        elif role == "admin":
            st.info("🧭 You are a **Company Admin**.")
        else:
            st.warning("👤 You are a **Team Member**.")

    # 🔹 Platform admin flag
    is_platform_admin = st.session_state.get("is_admin", False)

    # 🔹 Sidebar Navigation
    st.sidebar.title("Navigation")

    # ✅ Platform admin gets its own isolated dashboard
    if is_platform_admin:
        pages = ["🛡️ Admin Dashboard"]
    else:
        if role in ["owner", "admin"]:
            pages = ["Create Agent", "Chat with Agent", "Manage Agents", "Manage Users"]
        else:
            pages = ["Chat with Agent"]

    page = st.sidebar.selectbox("Go to", pages)

    st.sidebar.markdown("---")
    if st.sidebar.button("🔒 Logout"):
        clear_session_state()
        st.success("Logged out successfully.")
        st.rerun()

    # 🔹 Page Routing
    if page == "Create Agent":
        create_agent_page(role)
    elif page == "Chat with Agent":
        chat_page()
    elif page == "Manage Agents":
        manage_agents_page(role)
    elif page == "🛡️ Admin Dashboard":
        admin_dashboard_page()
    elif page == "Manage Users":
        manage_users_page(role)



    # Sidebar info
    if st.session_state.get("company_role") in ["owner", "admin"]:
        st.sidebar.markdown("---")
        st.sidebar.info(
            "🚀 **AI Agent Builder**\n\n"
            "Create specialized AI assistants for:\n\n"
            "• Customer Support\n\n"
            "• HR & Onboarding\n\n"
            "• Payments & Transactions\n\n"
            "• Compliance & Verification\n\n"
            "No coding required!"
        )
 

# --------------------------
# ENTRY POINT
# --------------------------
# ✅ Load persistent login info BEFORE checking for token
load_session_state()
initialize_company_data()

if "token" not in st.session_state or not st.session_state["token"]:
    login_page()
else:
    main_app()
