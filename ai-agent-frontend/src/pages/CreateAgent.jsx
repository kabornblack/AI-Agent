import React, { useState, useEffect } from "react";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

function CreateAgentPage({ userRole, companyName }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    system_prompt: "",
  });
  const [knowledgeText, setKnowledgeText] = useState("");
  const [knowledgeFiles, setKnowledgeFiles] = useState([]);
  const [showKnowledgeSection, setShowKnowledgeSection] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [companyData, setCompanyData] = useState(null);
  const [clearForm, setClearForm] = useState(false);

  // Check if company already has knowledge
  useEffect(() => {
    checkCompanyKnowledge();
  }, []);

  // Clear form if flagged from successful creation
  useEffect(() => {
    if (clearForm) {
      setFormData({
        name: "",
        description: "",
        system_prompt: "",
      });
      setKnowledgeText("");
      setKnowledgeFiles([]);
      setClearForm(false);
    }
  }, [clearForm]);

  const checkCompanyKnowledge = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/companies`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const companies = await response.json();
        if (companies && companies.length > 0) {
          const currentCompany = companies[0];
          setCompanyData(currentCompany);

          // PERMANENTLY hide knowledge section if company already has knowledge
          const hasKnowledge =
            currentCompany.knowledge && currentCompany.knowledge.knowledge_text;
          setShowKnowledgeSection(!hasKnowledge);
        }
      }
    } catch (error) {
      console.error("Error checking company knowledge:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    setKnowledgeFiles(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    // Validation - Agent Name and System Prompt are always required
    if (!formData.name || !formData.system_prompt) {
      setMessage({
        type: "error",
        text: "Agent Name and System Prompt are required!",
      });
      setLoading(false);
      return;
    }

    // Validation - Knowledge is MANDATORY when section is shown
    if (showKnowledgeSection && !knowledgeText.trim()) {
      setMessage({
        type: "error",
        text: "Knowledge base is required for the first agent! Please add text knowledge or upload documents.",
      });
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");

      // Prepare agent data - exactly like Streamlit
      const agentData = {
        name: formData.name,
        description: formData.description,
        system_prompt: formData.system_prompt,
        company_name: companyName || companyData?.name,
        knowledge_texts:
          showKnowledgeSection && knowledgeText.trim()
            ? [knowledgeText.trim()]
            : [],
      };

      console.log("Creating agent with data:", agentData);

      const response = await fetch(`${API_BASE}/agents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(agentData),
      });

      if (response.ok) {
        const result = await response.json();

        // Set success message
        setMessage({
          type: "success",
          text: `✅ Agent '${formData.name}' created successfully for '${
            companyName || companyData?.name
          }'!`,
        });

        // Set flag to clear form on next render
        setClearForm(true);

        // Refresh company data to update knowledge status - this will permanently hide knowledge section
        await checkCompanyKnowledge();
      } else if (response.status === 400) {
        const errorData = await response.json();
        setMessage({
          type: "error",
          text: `❌ ${errorData.detail || "Unknown error"}`,
        });
      } else {
        const errorText = await response.text();
        setMessage({
          type: "error",
          text: `Failed to create agent: ${errorText}`,
        });
      }
    } catch (error) {
      console.error("Error creating agent:", error);
      setMessage({
        type: "error",
        text: "Error connecting to API. Please check if the backend is running.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-[95%] mx-auto pt-20 ">
      {/* Header Section */}
      <div className="mb-4 pl-2">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900/80 mb-2">
          🤖 AI Agent Builder - Plug & Play
        </h1>
        <p className="text-lg text-gray-600 mb-4">
          Create your own AI agents in minutes!
        </p>
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-800/70 pt-4">
          Create New AI Agent
        </h2>

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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* <div className="p-6 border-b border-gray-200"></div> */}

        <div className="p-6">
          {/* Success Message */}
          {message.type === "success" && (
            <div className="mb-6 p-4 bg-green-50 text-green-800 border border-green-200 rounded-lg">
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Agent Details Section */}
            <div>
              {/* <h3 className="text-lg font-medium text-gray-900 mb-4">
                Agent Details
              </h3> */}

              <div className="space-y-4">
                {/* Agent Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700/70 mb-2">
                    Agent Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Customer Support Expert"
                    className="w-full px-3 py-2 bg bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-transparent"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700/70 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="What does this agent do?"
                    rows="3"
                    className="w-full px-3 py-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-transparent"
                  />
                </div>

                {/* System Prompt */}
                <div>
                  <label className="block text-sm font-medium text-gray-700/70 mb-2">
                    System Prompt
                  </label>
                  <textarea
                    name="system_prompt"
                    value={formData.system_prompt}
                    onChange={handleInputChange}
                    placeholder="You are a helpful customer support agent..."
                    rows="5"
                    className="w-full px-3 py-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 pt-6"></div>

            {/* Knowledge Base Section - Only show if company doesn't have knowledge */}
            {showKnowledgeSection ? (
              <div>
                <h3 className="text-xl font-medium text-gray-900/80 mb-1">
                  Knowledge Base
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Upload documents or add text that your agent should reference
                </p>

                {/* File Upload */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload documents
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      accept=".txt,.pdf"
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer block"
                    >
                      <div className="text-gray-400 mb-2">
                        <svg
                          className="mx-auto h-12 w-12"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-600">
                        Drag and drop files here
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        Limit 200MB per file • TXT, PDF
                      </p>
                    </label>
                  </div>
                  {knowledgeFiles.length > 0 && (
                    <div className="mt-2 text-sm text-gray-600">
                      Selected files:{" "}
                      {knowledgeFiles.map((f) => f.name).join(", ")}
                    </div>
                  )}
                </div>

                {/* Text Knowledge - MANDATORY when section is shown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Or paste text knowledge *
                  </label>
                  <textarea
                    value={knowledgeText}
                    onChange={(e) => setKnowledgeText(e.target.value)}
                    placeholder="Enter knowledge text that your agent should use for answering questions..."
                    rows="4"
                    className="w-full px-3 py-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-transparent"
                    required={showKnowledgeSection}
                  />
                  {showKnowledgeSection && (
                    <p className="text-sm text-red-600/70 mt-1">
                      Knowledge base is required for your first agent creation.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              // Show info message when knowledge already exists
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="items-center">
                  <p className="text-blue-800 font-medium">
                    🧠 Company Knowledge Base Available
                  </p>

                  <p className="text-blue-600 text-sm">
                    This company already has a knowledge base. You can manage or
                    update it from 'Manage Agents'.
                  </p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {message.type === "error" && (
              <div className="p-4 bg-red-50 text-red-800 border border-red-200 rounded-md">
                {message.text}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-start pt-1">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-1.5 bg-blue-500 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Creating Agent...
                  </div>
                ) : (
                  "Create Agent"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateAgentPage;
