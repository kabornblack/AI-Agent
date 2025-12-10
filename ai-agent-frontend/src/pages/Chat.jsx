import React, { useState, useEffect } from "react";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

function ChatPage({ userRole, companyName }) {
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [agentDetails, setAgentDetails] = useState(null);

  // Fetch companies on component mount
  useEffect(() => {
    fetchCompanies();
  }, []);

  // Fetch agents when company is selected
  useEffect(() => {
    if (selectedCompany) {
      fetchAgents(selectedCompany);
    } else {
      setAgents([]);
      setSelectedAgent("");
      setConversations([]);
    }
  }, [selectedCompany]);

  // Fetch conversations when agent is selected
  useEffect(() => {
    if (selectedAgent) {
      fetchConversations(selectedAgent);
      // Find and set agent details
      const agent = agents.find((a) => a.id === parseInt(selectedAgent));
      setAgentDetails(agent);
    } else {
      setConversations([]);
      setAgentDetails(null);
    }
  }, [selectedAgent, agents]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/companies`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const companiesData = await response.json();
        setCompanies(companiesData);

        // Auto-select the first company if only one exists
        if (companiesData.length === 1) {
          setSelectedCompany(companiesData[0].id.toString());
        }
      } else {
        console.error("Failed to fetch companies");
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async (companyId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE}/companies/${companyId}/agents`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const agentsData = await response.json();
        setAgents(agentsData);

        // Auto-select the first agent if only one exists
        if (agentsData.length === 1) {
          setSelectedAgent(agentsData[0].id.toString());
        } else {
          setSelectedAgent("");
        }
      } else {
        console.error("Failed to fetch agents");
        setAgents([]);
      }
    } catch (error) {
      console.error("Error fetching agents:", error);
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversations = async (agentId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE}/agents/${agentId}/conversations`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const conversationsData = await response.json();
        setConversations(conversationsData.slice(0, 10)); // Show last 10 conversations
      } else {
        console.error("Failed to fetch conversations");
        setConversations([]);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
      setConversations([]);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!userQuery.trim() || !selectedAgent) return;

    setSending(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          agent_id: parseInt(selectedAgent),
          user_query: userQuery.trim(),
        }),
      });

      if (response.ok) {
        const result = await response.json();

        // Add new conversation to the list
        const newConversation = {
          id: Date.now(), // Temporary ID
          user_query: userQuery.trim(),
          agent_response: result.response,
          created_at: new Date().toISOString(),
        };

        setConversations((prev) => [newConversation, ...prev]);
        setUserQuery("");
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.detail || "Failed to get response"}`);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const getSelectedCompanyName = () => {
    const company = companies.find((c) => c.id === parseInt(selectedCompany));
    return company ? company.name : "";
  };

  // Truncate description to 10-15 words
  const truncateDescription = (description) => {
    if (!description) return "No description provided";
    const words = description.split(" ");
    if (words.length <= 7) return description;
    return words.slice(0, 7).join(" ") + "...";
  };

  return (
    <div className="w-[95%] mx-auto pt-20">
      {/* Header Section */}
      <div className="mb-4 pl-2">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900/80 mb-2">
          🤖 AI Agent Builder - Plug & Play
        </h1>
        <p className="text-lg text-gray-600 mb-4">
          Create your own AI agents in minutes!
        </p>
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-800/70 pt-4">
          💬 Chat with Your Company Agents
        </h2>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          {/* Company Selection */}
          {/* <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company
            </label>
            {companies.length > 0 && selectedCompany ? (
              <div className="inline-flex items-center px-4 py-1 bg-blue-100 text-blue-800 rounded-lg border border-blue-200">
                <span className="text-lg mr-2">🏢</span>
                <span className="font-semibold text-lg">
                  {getSelectedCompanyName()}
                </span>
              </div>
            ) : (
              <p className="text-gray-500 italic">No company selected</p>
            )}
          </div> */}

          {/* AGENT SELECTION - CHANGED FROM DROPDOWN TO CARDS */}
          {selectedCompany && agents.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Select Agent ({agents.length} available)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    onClick={() => setSelectedAgent(agent.id.toString())}
                    className={`px-4 py-2 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                      selectedAgent === agent.id.toString()
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-blue-300"
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-blue-600">🤖</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {agent.name}
                        </h3>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {truncateDescription(agent.description)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end"></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Agents Message */}
          {selectedCompany && agents.length === 0 && !loading && (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-6xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No Agents Available
              </h3>
              <p className="text-gray-500 mb-4">
                This company has no agents yet. Create your first agent to start
                chatting!
              </p>
            </div>
          )}

          {/* Chat Interface */}
          {selectedAgent && agentDetails && (
            <div className="border border-gray-200 rounded-lg">
              {/* Agent Header */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-gray-200 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      🤖 {agentDetails.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {agentDetails.description || "No description provided"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      Company: {getSelectedCompanyName()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              {/* Chat Messages */}
              <div className="h-96 overflow-y-auto p-4 bg-gray-50">
                {conversations.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <div className="text-4xl mb-4">💬</div>
                    <p className="text-lg font-medium mb-2">
                      Start a conversation
                    </p>
                    <p>
                      Send a message to begin chatting with {agentDetails.name}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {conversations
                      .slice()
                      .reverse()
                      .map((conv, index) => (
                        <div key={conv.id || index} className="space-y-3">
                          {/* User Message */}
                          <div className="flex justify-end">
                            <div className="bg-blue-600 text-white rounded-lg px-4 py-2 max-w-2xl">
                              <p className="text-sm">{conv.user_query}</p>
                            </div>
                          </div>

                          {/* Agent Response */}
                          <div className="flex justify-start">
                            <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 max-w-2xl shadow-sm">
                              <p className="text-sm text-gray-800 whitespace-pre-wrap">
                                {conv.agent_response}
                              </p>
                              <p className="text-xs text-gray-400 mt-2 text-right">
                                {new Date(conv.created_at).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="border-t border-gray-200 p-4 bg-white rounded-b-lg">
                <form onSubmit={handleSendMessage} className="flex space-x-4">
                  <input
                    type="text"
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    placeholder="Type your message here..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={!userQuery.trim() || sending}
                    className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {sending ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Sending...
                      </div>
                    ) : (
                      "Send"
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-500 mt-2">Loading...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatPage;
