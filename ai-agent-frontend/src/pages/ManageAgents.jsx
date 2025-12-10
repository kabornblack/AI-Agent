import React, { useState, useEffect } from "react";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

function ManageAgentsPage({ userRole, companyName }) {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingKnowledge, setEditingKnowledge] = useState(null);
  const [knowledgeText, setKnowledgeText] = useState("");
  const [updatingKnowledge, setUpdatingKnowledge] = useState(false);
  const [conversations, setConversations] = useState({});
  const [expandedAgents, setExpandedAgents] = useState({});
  const [deletingAgents, setDeletingAgents] = useState({});
  const [expandedKnowledge, setExpandedKnowledge] = useState({});
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const [expandedPrompts, setExpandedPrompts] = useState({});

  // Fetch companies data
  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/companies`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const companiesData = await response.json();
        setCompanies(companiesData);
      } else {
        console.error("Failed to fetch companies");
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
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
        setConversations((prev) => ({
          ...prev,
          [agentId]: conversationsData.slice(0, 3), // Show last 3 conversations
        }));
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };

  const handleEditKnowledge = (company) => {
    setEditingKnowledge(company.id);
    setKnowledgeText(company.knowledge?.knowledge_text || "");
  };

  const handleSaveKnowledge = async (companyId) => {
    if (!knowledgeText.trim()) {
      alert("Knowledge text cannot be empty");
      return;
    }

    setUpdatingKnowledge(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE}/companies/${companyId}/knowledge`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            knowledge_text: knowledgeText.trim(),
          }),
        }
      );

      if (response.ok) {
        // Refresh companies data
        await fetchCompanies();
        setEditingKnowledge(null);
        setKnowledgeText("");
      } else {
        const errorData = await response.json();
        alert(`Failed to update knowledge: ${errorData.detail}`);
      }
    } catch (error) {
      console.error("Error updating knowledge:", error);
      alert("Network error. Please try again.");
    } finally {
      setUpdatingKnowledge(false);
    }
  };

  const handleDeleteKnowledge = async (companyId, companyName) => {
    if (
      !window.confirm(
        `Are you sure you want to delete the knowledge base for "${companyName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE}/companies/${companyId}/knowledge`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        // Refresh companies data
        await fetchCompanies();
        alert(`Knowledge base for "${companyName}" deleted successfully!`);
      } else {
        const errorData = await response.json();
        alert(`Failed to delete knowledge: ${errorData.detail}`);
      }
    } catch (error) {
      console.error("Error deleting knowledge:", error);
      alert("Network error. Please try again.");
    }
  };

  const handleCancelEdit = () => {
    setEditingKnowledge(null);
    setKnowledgeText("");
  };

  const handleDeleteAgent = async (agentId, agentName) => {
    // First step: Show confirmation warning
    if (!deletingAgents[agentId]) {
      setDeletingAgents((prev) => ({ ...prev, [agentId]: true }));
      return;
    }

    // Second step: Actually delete
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/agents/${agentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Refresh companies data
        await fetchCompanies();
        alert(`Agent "${agentName}" deleted successfully!`);
        setDeletingAgents((prev) => ({ ...prev, [agentId]: false }));
      } else {
        const errorData = await response.json();
        alert(`Failed to delete agent: ${errorData.detail}`);
        setDeletingAgents((prev) => ({ ...prev, [agentId]: false }));
      }
    } catch (error) {
      console.error("Error deleting agent:", error);
      alert("Network error. Please try again.");
      setDeletingAgents((prev) => ({ ...prev, [agentId]: false }));
    }
  };

  const cancelDeleteAgent = (agentId) => {
    setDeletingAgents((prev) => ({ ...prev, [agentId]: false }));
  };

  const handleDeleteCompany = async (companyId, companyName) => {
    if (
      !window.confirm(
        `Are you sure you want to delete company "${companyName}" and all its data? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/companies/${companyId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Refresh companies data
        await fetchCompanies();
        alert(`Company "${companyName}" deleted successfully!`);
      } else {
        const errorData = await response.json();
        alert(`Failed to delete company: ${errorData.detail}`);
      }
    } catch (error) {
      console.error("Error deleting company:", error);
      alert("Network error. Please try again.");
    }
  };

  const toggleAgentExpansion = (agentId) => {
    setExpandedAgents((prev) => ({
      ...prev,
      [agentId]: !prev[agentId],
    }));

    // Fetch conversations if not already loaded
    if (!conversations[agentId] && !expandedAgents[agentId]) {
      fetchConversations(agentId);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-500 mt-2">Loading companies and agents...</p>
        </div>
      </div>
    );
  }

  // Helper function to truncate text by words
  const truncateByWords = (text, wordLimit) => {
    if (!text) return "";
    const words = text.split(" ");
    if (words.length <= wordLimit) return text;
    return words.slice(0, wordLimit).join(" ") + "...";
  };

  // Toggle functions for expanding content
  const toggleKnowledgeExpansion = (companyId) => {
    setExpandedKnowledge((prev) => ({
      ...prev,
      [companyId]: !prev[companyId],
    }));
  };

  const toggleDescriptionExpansion = (agentId) => {
    setExpandedDescriptions((prev) => ({ ...prev, [agentId]: !prev[agentId] }));
  };

  const togglePromptExpansion = (agentId) => {
    setExpandedPrompts((prev) => ({ ...prev, [agentId]: !prev[agentId] }));
  };

  return (
    <div className="w-[95%] mx-auto pt-20">
      {/* Header Section */}
      <div className="mb-4">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900/80 mb-2">
          🤖 AI Agent Builder - Plug & Play
        </h1>
        <p className="text-lg text-gray-600 mb-4">
          Create your own AI agents in minutes!
        </p>
        <div className="p-1 border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-800/80">
            Manage Companies & Agents
          </h2>
          {/* <p className="text-gray-600 text-sm">
            View, edit, and manage your company's AI agents and knowledge base.
          </p> */}
        </div>

        {/* Role Badge */}
        {/* {userRole === "owner" && (
          <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            <span className="mr-2">👑</span>
            You are the Company Owner.
          </div>
        )}
        {userRole === "admin" && (
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            <span className="mr-2">🧭</span>
            You are a Company Admin.
          </div>
        )} */}
      </div>

      {/* Main Content */}
      <div className="">
        <div className="p-2">
          {companies.length === 0 ? (
            <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-6xl mb-4">🏢</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No Companies Found
              </h3>
              <p className="text-gray-500">
                You don't have access to any companies yet.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {companies.map((company) => (
                <div
                  key={company.id}
                  className="border border-gray-200 rounded-lg"
                >
                  {/* Company Header */}
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-t-lg border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">🏢</span>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-800">
                            {company.name}
                          </h3>
                          <p className="text-sm text-gray-600 flex items-center">
                            <span className="mr-1">📅</span>
                            Created at: {formatDate(company.created_at)}
                          </p>
                        </div>
                      </div>

                      {/* Delete Company Button (Owner only) */}
                      {userRole === "owner" && (
                        <button
                          onClick={() =>
                            handleDeleteCompany(company.id, company.name)
                          }
                          className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                        >
                          🗑️ Delete Company
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Company Knowledge Section */}
                  <div className="p-6 border-b border-gray-200">
                    <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <span className="mr-2">🧠</span>
                      Company Knowledge
                    </h4>

                    {editingKnowledge === company.id ? (
                      <div className="space-y-4">
                        <textarea
                          value={knowledgeText}
                          onChange={(e) => setKnowledgeText(e.target.value)}
                          placeholder="Enter your company knowledge base here..."
                          rows="6"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleSaveKnowledge(company.id)}
                            disabled={updatingKnowledge}
                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
                          >
                            {updatingKnowledge
                              ? "Saving..."
                              : "💾 Save Knowledge"}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-4 py-2 bg-gray-500 text-white text-sm font-medium rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                          >
                            ❌ Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {company.knowledge ? (
                          <div className="space-y-4">
                            <div className="bg-gray-100 p-4 rounded-lg border border-gray-200">
                              <p className="text-gray-700 whitespace-pre-wrap">
                                {expandedKnowledge[company.id]
                                  ? company.knowledge.knowledge_text
                                  : truncateByWords(
                                      company.knowledge.knowledge_text,
                                      100
                                    )}
                              </p>
                              {company.knowledge.knowledge_text.split(" ")
                                .length > 150 && (
                                <button
                                  onClick={() =>
                                    toggleKnowledgeExpansion(company.id)
                                  }
                                  className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-2"
                                >
                                  {expandedKnowledge[company.id]
                                    ? "Show Less"
                                    : "Show More"}
                                </button>
                              )}
                              <p className="text-xs text-gray-500 mt-2">
                                Last updated:{" "}
                                {formatDate(company.knowledge.created_at)}
                              </p>
                            </div>
                            <div className="flex space-x-3">
                              <button
                                onClick={() => handleEditKnowledge(company)}
                                className="px-4 py-1 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                              >
                                ✏️ Edit Knowledge
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-6 bg-yellow-50 rounded-lg border border-yellow-200">
                            <p className="text-yellow-800 mb-3">
                              No knowledge base found for this company yet.
                            </p>
                            {/* Add Knowledge Button (Owner and Admin only) */}
                            {(userRole === "owner" || userRole === "admin") && (
                              <button
                                onClick={() => handleEditKnowledge(company)}
                                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                              >
                                ➕ Add Knowledge
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Agents Section */}
                  <div className="p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <span className="mr-2">🤖</span>
                      Agents
                    </h4>

                    {company.agents && company.agents.length > 0 ? (
                      <div className="space-y-4">
                        {company.agents.map((agent) => (
                          <div
                            key={agent.id}
                            className="border border-gray-200 rounded-lg"
                          >
                            {/* Agent Header */}
                            <div className="bg-gray-200 p-4 rounded-t-lg border-gray-200">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <span className="text-xl">🤖</span>
                                  <div>
                                    <h5 className="font-semibold text-gray-800">
                                      {agent.name}
                                    </h5>
                                    <p className="text-sm text-gray-600">
                                      Created: {formatDate(agent.created_at)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() =>
                                      toggleAgentExpansion(agent.id)
                                    }
                                    className="px-3 py-1 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors"
                                  >
                                    {expandedAgents[agent.id]
                                      ? "▲ Hide"
                                      : "▼ Show"}{" "}
                                    Conversations
                                  </button>
                                  {/* Delete Agent Button (Owner and Admin only) */}
                                  {
                                    <div className="flex space-x-2">
                                      {deletingAgents[agent.id] ? (
                                        <>
                                          <button
                                            onClick={() =>
                                              handleDeleteAgent(
                                                agent.id,
                                                agent.name
                                              )
                                            }
                                            className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                                          >
                                            ✅ Confirm
                                          </button>
                                          <button
                                            onClick={() =>
                                              cancelDeleteAgent(agent.id)
                                            }
                                            className="px-3 py-1 bg-gray-500 text-white text-sm rounded-md hover:bg-gray-600 transition-colors"
                                          >
                                            ❌ Cancel
                                          </button>
                                        </>
                                      ) : (
                                        <button
                                          onClick={() =>
                                            handleDeleteAgent(
                                              agent.id,
                                              agent.name
                                            )
                                          }
                                          className="px-3 py-1 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 transition-colors"
                                        >
                                          🗑️ Delete
                                        </button>
                                      )}
                                    </div>
                                  }
                                </div>
                              </div>
                            </div>

                            {/* Agent Details */}
                            <div className="p-4 bg-gray-100">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                  <label className="text-sm font-medium text-gray-700">
                                    Description
                                  </label>
                                  <p className="text-gray-600 mt-1">
                                    {expandedDescriptions[agent.id]
                                      ? agent.description ||
                                        "No description provided"
                                      : truncateByWords(
                                          agent.description ||
                                            "No description provided",
                                          30
                                        )}
                                  </p>
                                  {agent.description &&
                                    agent.description.split(" ").length >
                                      30 && (
                                      <button
                                        onClick={() =>
                                          toggleDescriptionExpansion(agent.id)
                                        }
                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-1"
                                      >
                                        {expandedDescriptions[agent.id]
                                          ? "Show Less"
                                          : "Show More"}
                                      </button>
                                    )}
                                </div>

                                <div>
                                  <label className="text-sm font-medium text-gray-700">
                                    System Prompt
                                  </label>
                                  <p className="text-gray-600 mt-1">
                                    {expandedPrompts[agent.id]
                                      ? agent.system_prompt ||
                                        "No system prompt set"
                                      : truncateByWords(
                                          agent.system_prompt ||
                                            "No system prompt set",
                                          30
                                        )}
                                  </p>
                                  {agent.system_prompt &&
                                    agent.system_prompt.split(" ").length >
                                      30 && (
                                      <button
                                        onClick={() =>
                                          togglePromptExpansion(agent.id)
                                        }
                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-1"
                                      >
                                        {expandedPrompts[agent.id]
                                          ? "Show Less"
                                          : "Show More"}
                                      </button>
                                    )}
                                </div>
                              </div>

                              {/* Recent Conversations */}
                              {expandedAgents[agent.id] && (
                                <div className="mt-4 border-t border-gray-200 pt-4">
                                  <h6 className="font-medium text-gray-700 mb-3">
                                    Recent Conversations
                                  </h6>
                                  {conversations[agent.id] &&
                                  conversations[agent.id].length > 0 ? (
                                    <div className="space-y-3">
                                      {conversations[agent.id].map(
                                        (conv, index) => (
                                          <div
                                            key={index}
                                            className="bg-white p-3 rounded-lg border border-gray-200"
                                          >
                                            <div className="mb-2">
                                              <span className="text-sm font-medium text-gray-700">
                                                Q:
                                              </span>
                                              <p className="text-sm text-gray-600 ml-2">
                                                {conv.user_query}
                                              </p>
                                            </div>
                                            <div>
                                              <span className="text-sm font-medium text-gray-700">
                                                A:
                                              </span>
                                              <p className="text-sm text-gray-600 ml-2">
                                                {conv.agent_response.substring(
                                                  0,
                                                  200
                                                )}
                                                ...
                                              </p>
                                            </div>
                                          </div>
                                        )
                                      )}
                                    </div>
                                  ) : (
                                    <p className="text-gray-500 text-sm">
                                      No conversations yet.
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="text-4xl mb-4">🤖</div>
                        <p className="text-gray-600">No agents created yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ManageAgentsPage;
