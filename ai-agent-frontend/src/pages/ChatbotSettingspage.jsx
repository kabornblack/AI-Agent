// src/pages/ChatbotSettingsPage.jsx - Add debugging
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import ChatbotSettings from "../components/admin/ChatbotSettings";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

function ChatbotSettingsPage({ userRole, isPlatformAdmin }) {
  const { companyId } = useParams();
  const [currentCompanyId, setCurrentCompanyId] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Debug: Log the props
  console.log("ChatbotSettingsPage props:", { userRole, isPlatformAdmin });

  useEffect(() => {
    fetchUserCompanies();
  }, []);

  const fetchUserCompanies = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/companies`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Fetched companies:", data);
        setCompanies(data);

        // If user is platform admin, set first company as default
        if (isPlatformAdmin && data.length > 0) {
          setCurrentCompanyId(data[0].id);
        }
        // If regular user, use their company
        else if (data.length > 0) {
          setCurrentCompanyId(data[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-500 mt-2">Loading chatbot settings...</p>
        </div>
      </div>
    );
  }

  // Platform admin can see all companies
  const canAccess =
    isPlatformAdmin || userRole === "owner" || userRole === "admin";

  console.log("Access check:", {
    canAccess,
    isPlatformAdmin,
    userRole,
    hasCompanies: companies.length > 0,
  });

  if (!canAccess) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h3 className="text-xl font-semibold text-yellow-800 mb-2">
            Access Restricted
          </h3>
          <p className="text-yellow-700">
            Only company owners and administrators can configure chatbot
            settings.
            <br />
            Your role: {userRole || "unknown"}, Is Platform Admin:{" "}
            {isPlatformAdmin ? "Yes" : "No"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🤖 Chatbot Settings
        </h1>
        <p className="text-lg text-gray-600">
          Configure your public AI assistant and embed it on your website
        </p>
      </div>

      {/* Show current user info for debugging */}
      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-700">
          <strong>User:</strong> {userRole || "unknown"} |
          <strong> Platform Admin:</strong> {isPlatformAdmin ? "Yes" : "No"} |
          <strong> Companies:</strong> {companies.length}
        </p>
      </div>

      {/* Company Selector for Platform Admins */}
      {isPlatformAdmin && companies.length > 1 && (
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Company to Configure
          </label>
          <select
            value={currentCompanyId || ""}
            onChange={(e) => setCurrentCompanyId(Number(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name} ({company.role})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Chatbot Settings Component */}
      {currentCompanyId ? (
        <ChatbotSettings
          companyId={currentCompanyId}
          userRole={isPlatformAdmin ? "admin" : userRole}
        />
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="text-6xl mb-4">🏢</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No Company Found
          </h3>
          <p className="text-gray-500">
            You need to be part of a company to configure chatbot settings.
            {companies.length === 0 &&
              " You are not associated with any companies."}
          </p>
        </div>
      )}

      {/* Information Section */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">
          ℹ️ About Public Chatbot
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-blue-700 mb-2">
              <strong>Public Chatbot:</strong> A customizable AI assistant that
              can be embedded on your website. Visitors can ask questions about
              your company, products, or services.
            </p>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Answers questions based on your company knowledge</li>
              <li>• Collects emails for unanswered questions</li>
              <li>• Fully customizable appearance</li>
            </ul>
          </div>
          <div>
            <p className="text-sm text-blue-700 mb-2">
              <strong>How it works:</strong>
            </p>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal pl-4">
              <li>Configure settings and appearance</li>
              <li>Copy the embed code</li>
              <li>Add to your website HTML</li>
              <li>Visitors can chat immediately</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatbotSettingsPage;
