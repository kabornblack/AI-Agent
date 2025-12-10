// src/components/demo/DemoChat.jsx
import React, { useState, useRef, useEffect } from "react";

const DemoChat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const sampleAgents = [
    {
      id: "support",
      name: "Customer Support Agent",
      description: "Answer product questions and technical issues",
      systemPrompt:
        "You are a helpful customer support agent for a SaaS company. Be friendly, professional, and solution-oriented.",
    },
    {
      id: "hr",
      name: "HR Assistant",
      description: "Answers HR questions and company policies",
      systemPrompt:
        "You are an HR assistant. Help with common HR questions, company policies, and employee resources.",
    },
    {
      id: "sales",
      name: "Sales Consultant",
      description: "Helps customers understand product value",
      systemPrompt:
        "You are a sales consultant. Focus on understanding customer needs and showing product value.",
    },
    {
      id: "finance",
      name: "Finance Advisor",
      description: "Provides financial insights and budgeting",
      systemPrompt:
        "You are a finance advisor. Help users understand budgets, financial planning, cost optimization, and provide clear, data-driven recommendations.",
    },
  ];

  const [selectedAgent, setSelectedAgent] = useState(sampleAgents[0]);

  // Mock AI response function
  const getMockResponse = async (userMessage, agent) => {
    // Simulate API delay
    await new Promise((resolve) =>
      setTimeout(resolve, 1000 + Math.random() * 2000)
    );

    const responses = {
      support: [
        "I'd be happy to help with that! Our product has several features that might address your needs. Could you tell me more about what you're trying to accomplish?",
        "That's a great question! Our support team can help you with that. In the meantime, you might find our documentation helpful.",
        "I understand you're having an issue. Let me guide you through some troubleshooting steps that usually resolve this.",
      ],
      hr: [
        "Our company policy states that employees are entitled to 15 vacation days per year. Would you like me to explain how to request time off?",
        "For benefits enrollment, you'll need to visit the HR portal and complete the forms by the end of the month.",
        "The dress code is business casual Monday through Thursday, with casual Fridays.",
      ],
      sales: [
        "Our platform can definitely help with that! We've helped similar companies achieve a 40% increase in efficiency.",
        "That's exactly the kind of challenge our product is designed to solve. Would you like to see a quick demo?",
        "Great question! Our pricing starts at $49/month for the basic plan, which includes all core features.",
      ],
      finance: [
        "Based on typical budgeting principles, I recommend allocating your expenses using the 50/30/20 rule. Would you like help applying it to your situation?",
        "To optimize costs, we can review recurring expenses and identify areas where spending can be reduced without affecting productivity.",
        "I can help you estimate future expenses or forecast cash flow. What financial goal are you working toward?",
      ],
    };

    const agentResponses = responses[agent.id] || responses.support;
    return agentResponses[Math.floor(Math.random() * agentResponses.length)];
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await getMockResponse(input, selectedAgent);

      const aiMessage = {
        id: Date.now() + 1,
        type: "assistant",
        content: response,
        timestamp: new Date(),
        agent: selectedAgent.name,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error getting response:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetChat = () => {
    setMessages([]);
  };

  return (
    <div
      id="demo"
      className="min-h-screen bg-gradient-to-r from-blue-50 to-indigo-100 py-12"
    >
      <div className="max-w-7xl mx-auto bg-indigo-100 rounded-2xl shadow-lg border border-gray-200">
        {/* Demo Header */}
        <div className="bg-blue-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Live Demo</h2>
              <p className="text-blue-100">
                Experience AI Agent Builder in action
              </p>
            </div>
            <div className="bg-yellow-500 text-yellow-900 px-3 py-1 rounded-full text-sm font-semibold">
              DEMO MODE
            </div>
          </div>
        </div>

        {/* Agent Selection */}
        <div className="p-6 border-b border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Choose an AI Agent to Test:
          </label>
          <div className="flex flex-wrap gap-3">
            {sampleAgents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => {
                  setSelectedAgent(agent);
                  resetChat();
                }}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  selectedAgent.id === agent.id
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-gray-300 text-gray-700 hover:border-blue-400"
                }`}
              >
                <div className="font-medium">{agent.name}</div>
                <div className="text-xs opacity-75">{agent.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Current Agent Info */}
        <div className="bg-gray-50 p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <div>
              <span className="font-medium text-gray-900">
                Active: {selectedAgent.name}
              </span>
              <span className="text-gray-600 text-sm ml-2">
                • Session data is temporary
              </span>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="h-96 overflow-y-auto p-6 bg-gray-50">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">💬</div>
              <p className="text-lg font-medium mb-2">Start a conversation</p>
              <p>Send a message to test {selectedAgent.name}</p>
              <p className="text-sm mt-2 text-gray-400">
                This is a demo - no data is saved and responses are simulated
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.type === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-3/4 rounded-2xl px-4 py-3 ${
                      message.type === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-white border border-gray-200 shadow-sm"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    {message.agent && (
                      <p className="text-xs opacity-75 mt-1">
                        🤖 {message.agent}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-500">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 border-t border-gray-200 bg-white rounded-b-2xl">
          <form onSubmit={handleSendMessage} className="flex space-x-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Message ${selectedAgent.name}...`}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          </form>

          {/* Demo Limitations Notice */}
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <span className="text-yellow-600">💡</span>
              <div className="text-sm text-yellow-800">
                <strong>Demo Limitations:</strong> This is a simulated
                experience.
                <a
                  href="/register"
                  className="text-blue-600 hover:text-blue-800 font-medium ml-1"
                >
                  Sign up for free
                </a>{" "}
                to create your own custom agents with full functionality.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoChat;
