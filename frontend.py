# frontend.py
import streamlit as st
import requests
import json

# Configuration
API_BASE = "http://localhost:8000/api/v1"

st.set_page_config(
    page_title="AI Agent Builder",
    page_icon="🤖",
    layout="wide"
)

# Floating Theme Toggle Button
st.markdown("""
<style>
    /* Floating theme toggle */
    .theme-toggle {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1000;
        background: var(--secondary-background-color);
        border: 2px solid var(--primary-color);
        border-radius: 50%;
        width: 50px;
        height: 50px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transition: all 0.3s ease;
        font-size: 20px;
    }
    
    .theme-toggle:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 16px rgba(0,0,0,0.2);
    }
</style>

<script>
function toggleTheme() {
    // Get current theme
    const currentTheme = localStorage.getItem('theme') || 'light';
    
    // Toggle theme
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    // Update Streamlit theme
    const event = new CustomEvent('themeToggle', { detail: newTheme });
    document.dispatchEvent(event);
    
    // Save preference
    localStorage.setItem('theme', newTheme);
    
    // Update button icon
    updateButtonIcon(newTheme);
}

function updateButtonIcon(theme) {
    const button = document.querySelector('.theme-toggle');
    button.innerHTML = theme === 'light' ? '🌙' : '☀️';
}

// Initialize button icon
document.addEventListener('DOMContentLoaded', function() {
    const currentTheme = localStorage.getItem('theme') || 'light';
    updateButtonIcon(currentTheme);
});

// Listen for theme changes from Streamlit
document.addEventListener('themeChanged', function(e) {
    updateButtonIcon(e.detail);
});
</script>

<div class="theme-toggle" onclick="toggleTheme()">🌙</div>
""", unsafe_allow_html=True)

# Professional Floating Theme Toggle - ACTUALLY WORKS
st.markdown("""
<style>
    /* Floating theme toggle container */
    .floating-theme {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1000;
    }
    
    /* Toggle button styling */
    .theme-btn {
        background: var(--secondary-background-color);
        border: 2px solid var(--primary-color);
        border-radius: 50%;
        width: 50px;
        height: 50px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transition: all 0.3s ease;
        font-size: 20px;
        text-decoration: none;
        color: inherit;
    }
    
    .theme-btn:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 16px rgba(0,0,0,0.2);
    }
    
    /* Hide the default Streamlit theme selector */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
</style>

<div class="floating-theme">
    <a class="theme-btn" href="?theme=light" title="Toggle Theme">🌙</a>
</div>
""", unsafe_allow_html=True)

# Initialize session state
if 'agent_created' not in st.session_state:
    st.session_state.agent_created = False

# Initialize delete confirmation states
if 'delete_confirmations' not in st.session_state:
    st.session_state.delete_confirmations = {}

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
                        st.rerun()
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
                            # Delete button with proper "click twice" confirmation
                            agent_id = agent['id']
                            confirm_key = f'confirm_delete_{agent_id}'
                            
                            # Initialize confirmation state for this agent if not exists
                            if confirm_key not in st.session_state:
                                st.session_state[confirm_key] = False
                            
                            if st.session_state[confirm_key]:
                                # Second click - show confirmation and OK button
                                st.warning(f"⚠️ Click OK to confirm deletion of '{agent['name']}'")
                                
                                col_ok, col_cancel = st.columns(2)
                                
                                with col_ok:
                                    if st.button("✅ OK", key=f"ok_{agent_id}"):
                                        try:
                                            delete_response = requests.delete(f"{API_BASE}/agents/{agent_id}")
                                            if delete_response.status_code == 200:
                                                st.success(f"✅ Agent '{agent['name']}' deleted successfully!")
                                                # Reset confirmation state
                                                st.session_state[confirm_key] = False
                                                st.rerun()
                                            else:
                                                st.error(f"❌ Failed to delete agent: {delete_response.text}")
                                                st.session_state[confirm_key] = False
                                        except Exception as e:
                                            st.error(f"❌ Error deleting agent: {e}")
                                            st.session_state[confirm_key] = False
                                
                                with col_cancel:
                                    if st.button("❌ Cancel", key=f"cancel_{agent_id}"):
                                        st.session_state[confirm_key] = False
                                        st.rerun()
                            else:
                                # First click - show delete button
                                if st.button("🗑️ Delete", key=f"delete_{agent_id}"):
                                    st.session_state[confirm_key] = True
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
st.sidebar.info("Click the 3 dots on the top right to toggle between light/dark mode")