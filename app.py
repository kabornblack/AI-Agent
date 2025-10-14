# app.py - Main file for Streamlit Cloud Deployment
import streamlit as st
import requests
import os


# Configuration - Dynamic API base for deployment
API_BASE = os.environ.get('API_BASE_URL', 'https://ai-agent-rkzf.onrender.com/api/v1') 

st.set_page_config(
    page_title="AI Agent Builder - Plug & Play",
    page_icon="🤖",
    layout="wide"
)

# Dark/Light mode CSS customization
st.markdown("""
<style>
    /* Main page background */
    .main {
        background-color: var(--background-color);
    }
    
    /* Cards and containers */
    .stExpander {
        background-color: var(--secondary-background-color);
        border: 1px solid var(--secondary-background-color);
        border-radius: 10px;
    }
    
    /* Headers */
    h1, h2, h3 {
        color: var(--text-color) !important;
    }
    
    /* Success messages */
    .stSuccess {
        background-color: #d4edda;
        border-color: #c3e6cb;
        color: #155724;
    }
    
    /* Info messages */
    .stInfo {
        background-color: #d1ecf1;
        border-color: #bee5eb;
        color: #0c5460;
    }
    
    /* Warning messages */
    .stWarning {
        background-color: #fff3cd;
        border-color: #ffeaa7;
        color: #856404;
    }
    
    /* Error messages */
    .stError {
        background-color: #f8d7da;
        border-color: #f5c6cb;
        color: #721c24;
    }
</style>
""", unsafe_allow_html=True)

# Initialize session state
if 'agent_created' not in st.session_state:
    st.session_state.agent_created = False

# Initialize delete confirmation states
for key in list(st.session_state.keys()):
    if key.startswith('confirm_delete_'):
        del st.session_state[key]

st.title("🤖 AI Agent Builder - Plug & Play")
st.markdown("Create your own AI agents in minutes!")

# Sidebar for navigation
page = st.sidebar.selectbox("Navigation", ["Create Agent", "Chat with Agent", "Manage Agents"])

if page == "Create Agent":
    st.header("Create New AI Agent")
    
    with st.form("create_agent_form"):
        name = st.text_input("Agent Name", placeholder="e.g., Customer Support Expert")
        description = st.text_area("Description", placeholder="What does this agent do?")
        system_prompt = st.text_area(
            "System Prompt", 
            height=150,
            placeholder="You are a helpful customer support agent. Always be polite and professional. If you don't know the answer, say you'll find out and escalate to a human."
        )
        
        st.subheader("Knowledge Base (Optional)")
        st.markdown("Upload documents or add text that your agent should reference")
        knowledge_files = st.file_uploader("Upload documents", type=['txt', 'pdf'], accept_multiple_files=True)
        knowledge_text = st.text_area("Or paste text knowledge", height=100)
        
        submitted = st.form_submit_button("Create Agent")
        
        if submitted:
            if not name or not system_prompt:
                st.error("Agent Name and System Prompt are required!")
            else:
                # Prepare knowledge texts
                knowledge_texts = []
                if knowledge_text:
                    knowledge_texts.append(knowledge_text)
                
                agent_data = {
                    "name": name,
                    "description": description,
                    "system_prompt": system_prompt,
                    "knowledge_texts": knowledge_texts
                }
                
                try:
                    response = requests.post(f"{API_BASE}/agents/", json=agent_data)
                    if response.status_code == 200:
                        st.success(f"✅ Agent '{name}' created successfully!")
                        st.session_state.agent_created = True
                        
                    elif response.status_code == 400:
                        error_detail = response.json().get('detail', 'Unknown error')
                        st.error(f"❌ {error_detail}")
                    else:
                        st.error(f"Failed to create agent: {response.text}")
                except Exception as e:
                    st.error(f"Error connecting to API: {e}")

    # Clear form after successful creation
    if st.session_state.agent_created:
        st.session_state.agent_created = False

elif page == "Chat with Agent":
    st.header("Chat with Your AI Agents")
    
    # Fetch available agents
    try:
        agents_response = requests.get(f"{API_BASE}/agents/")
        if agents_response.status_code == 200:
            agents = agents_response.json()
            
            if agents:
                agent_names = [f"{agent['id']}: {agent['name']}" for agent in agents]
                selected_agent = st.selectbox("Select an Agent", agent_names)
                agent_id = int(selected_agent.split(":")[0])
                
                # Get the selected agent details
                selected_agent_details = next((agent for agent in agents if agent['id'] == agent_id), None)
                
                if selected_agent_details:
                    st.info(f"**Role**: {selected_agent_details['description']}")
                
                # Chat interface
                user_query = st.text_input("Your question:")
                
                if st.button("Send") and user_query:
                    with st.spinner("Thinking..."):
                        query_data = {
                            "agent_id": agent_id,
                            "user_query": user_query
                        }
                        response = requests.post(f"{API_BASE}/query/", json=query_data)
                        
                        if response.status_code == 200:
                            result = response.json()
                            st.markdown("### Agent Response")
                            st.write(result['response'])
                        else:
                            st.error("Failed to get response from agent")
            else:
                st.info("No agents created yet. Go to 'Create Agent' to make your first one!")
        else:
            st.error("Failed to fetch agents")
    except Exception as e:
        st.error(f"Error connecting to API: {e}")

elif page == "Manage Agents":
    st.header("Manage Your AI Agents")
    
    try:
        agents_response = requests.get(f"{API_BASE}/agents/")
        if agents_response.status_code == 200:
            agents = agents_response.json()
            
            if not agents:
                st.info("No agents created yet. Go to 'Create Agent' to make your first one!")
            else:
                for agent in agents:
                    with st.expander(f"🤖 {agent['name']} (ID: {agent['id']})"):
                        col1, col2 = st.columns([3, 1])
                        
                        with col1:
                            st.write(f"**Description:** {agent['description']}")
                            st.write(f"**System Prompt:** {agent['system_prompt']}")
                            
                            # Show conversation history
                            st.subheader("Recent Conversations")
                            conv_response = requests.get(f"{API_BASE}/agents/{agent['id']}/conversations")
                            if conv_response.status_code == 200:
                                conversations = conv_response.json()
                                if conversations:
                                    for conv in conversations[:3]:
                                        st.markdown(f"**Q:** {conv['user_query']}")
                                        st.markdown(f"**A:** {conv['agent_response'][:100]}...")
                                        st.markdown("---")
                                else:
                                    st.info("No conversations yet for this agent")
                        
                        with col2:
                            # Delete button with confirmation
                            delete_key = f"delete_{agent['id']}"
                            cancel_key = f"cancel_{agent['id']}"
                            confirm_key = f'confirm_delete_{agent["id"]}'
                            
                            if st.button("🗑️ Delete", key=delete_key):
                                if st.session_state.get(confirm_key):
                                    # Second click - actually delete
                                    try:
                                        delete_response = requests.delete(f"{API_BASE}/agents/{agent['id']}")
                                        if delete_response.status_code == 200:
                                            st.success(f"✅ Agent '{agent['name']}' deleted!")
                                            st.rerun()
                                        else:
                                            st.error("Failed to delete agent")
                                    except Exception as e:
                                        st.error(f"Error deleting agent: {e}")
                                else:
                                    # First click - show confirmation
                                    st.session_state[confirm_key] = True
                                    st.warning(f"Click again to confirm deletion of '{agent['name']}'")
                            
                            # Reset confirmation if user navigates away
                            if st.button("Cancel", key=cancel_key):
                                if confirm_key in st.session_state:
                                    del st.session_state[confirm_key]
                                st.rerun()
                
                # Add bulk statistics
                st.subheader("📈 Agent Statistics")
                col1, col2, col3 = st.columns(3)
                with col1:
                    st.metric("Total Agents", len(agents))
                with col2:
                    total_conversations = 0
                    for agent in agents:
                        conv_response = requests.get(f"{API_BASE}/agents/{agent['id']}/conversations")
                        if conv_response.status_code == 200:
                            total_conversations += len(conv_response.json())
                    st.metric("Total Conversations", total_conversations)
                with col3:
                    st.metric("Active System", "✅ Online")
                            
        else:
            st.error("Failed to fetch agents")
    except Exception as e:
        st.error(f"Error connecting to API: {e}")

# Add deployment info in sidebar
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

st.sidebar.markdown("---")
st.sidebar.markdown("**Theme Settings**")
st.sidebar.info("Click the hamburger menu (☰) in top right to toggle between light/dark mode")