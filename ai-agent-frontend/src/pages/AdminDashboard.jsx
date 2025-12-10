import React, { useState, useEffect } from "react";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

function AdminDashboardPage() {
  const [allData, setAllData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deletingCompany, setDeletingCompany] = useState(null);
  const [expandedCompanies, setExpandedCompanies] = useState({});
  const [stats, setStats] = useState({
    totalCompanies: 0,
    totalUsers: 0,
    totalAgents: 0,
    totalConversations: 0,
  });

  // Fetch all data
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/debug/all-data`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAllData(data);
        calculateStats(data);
      } else {
        console.error("Failed to fetch admin data");
      }
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const companies = data.companies || [];
    const users = data.users || [];

    let totalAgents = 0;
    let totalConversations = 0;

    companies.forEach((company) => {
      totalAgents += company.agents?.length || 0;
      // Estimate conversations (you might want to add actual conversation count to your API)
      company.agents?.forEach((agent) => {
        totalConversations += 3; // Placeholder - replace with actual count from API
      });
    });

    setStats({
      totalCompanies: companies.length,
      totalUsers: users.length,
      totalAgents,
      totalConversations,
    });
  };

  const handleDeleteCompany = async (companyId, companyName) => {
    if (
      !window.confirm(
        `🚨 CRITICAL ACTION\n\nAre you sure you want to PERMANENTLY delete company "${companyName}"?\n\nThis will delete:\n• All company agents\n• All conversation history\n• All knowledge bases\n• All user associations\n\nThis action cannot be undone!`
      )
    ) {
      return;
    }

    setDeletingCompany(companyId);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/admin/companies/${companyId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Refresh data
        await fetchAllData();
        alert(
          `✅ Company "${companyName}" and all associated data deleted successfully!`
        );
      } else {
        const errorData = await response.json();
        alert(`❌ Failed to delete company: ${errorData.detail}`);
      }
    } catch (error) {
      console.error("Error deleting company:", error);
      alert("Network error. Please try again.");
    } finally {
      setDeletingCompany(null);
    }
  };

  const toggleCompanyExpansion = (companyId) => {
    setExpandedCompanies((prev) => ({
      ...prev,
      [companyId]: !prev[companyId],
    }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getRoleBadge = (role) => {
    const badges = {
      owner: { color: "bg-purple-100 text-purple-800", label: "Owner" },
      admin: { color: "bg-blue-100 text-blue-800", label: "Admin" },
      member: { color: "bg-gray-100 text-gray-800", label: "Member" },
      platform_admin: {
        color: "bg-red-100 text-red-800",
        label: "Platform Admin",
      },
    };

    const badge = badges[role] || badges.member;
    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}
      >
        {badge.label}
      </span>
    );
  };

  // Filter members to show only owners and admins
  const getAuthorityMembers = (members) => {
    return (
      members?.filter(
        (member) => member.role === "owner" || member.role === "admin"
      ) || []
    );
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-500 mt-2">Loading platform data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🛡️ Platform Admin Dashboard
            </h1>
            <p className="text-lg text-gray-600">
              Full system overview and company management
            </p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2">
            <p className="text-sm text-red-700 font-medium">
              Platform Administrator
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <span className="text-2xl">🏢</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Companies
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalCompanies}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <span className="text-2xl">👥</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalUsers}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <span className="text-2xl">🤖</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Agents</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalAgents}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <span className="text-2xl">💬</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Conversations
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalConversations}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* All Companies Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            All Registered Companies
          </h2>
          <p className="text-gray-600 mt-1">
            Manage and monitor all companies in the platform
          </p>
        </div>

        <div className="p-6">
          {!allData?.companies || allData.companies.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-6xl mb-4">🏢</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No Companies Found
              </h3>
              <p className="text-gray-500">
                No companies have been registered yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {allData.companies.map((company) => (
                <div
                  key={company.id}
                  className="border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                >
                  {/* Company Header - Always Visible */}
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="text-3xl">🏢</div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-800 mb-1">
                            {company.name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            <p>📅 Created: {formatDate(company.created_at)}</p>
                            <p>🤖 Agents: {company.agents?.length || 0}</p>
                            <p>👥 Members: {company.members?.length || 0}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => toggleCompanyExpansion(company.id)}
                          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                        >
                          {expandedCompanies[company.id] ? "▲ Hide" : "▼ Show"}{" "}
                          Details
                        </button>

                        <button
                          onClick={() =>
                            handleDeleteCompany(company.id, company.name)
                          }
                          disabled={deletingCompany === company.id}
                          className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
                        >
                          {deletingCompany === company.id ? (
                            <div className="flex items-center">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                              Deleting...
                            </div>
                          ) : (
                            "🗑️ Delete"
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Content */}
                  {expandedCompanies[company.id] && (
                    <div className="p-6 border-t border-gray-200 space-y-6">
                      {/* Knowledge Base */}
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                          <span className="mr-2">🧠</span>
                          Company Knowledge
                        </h4>
                        {company.knowledge ? (
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <p className="text-gray-700 whitespace-pre-wrap">
                              {company.knowledge.knowledge_text.length > 300
                                ? `${company.knowledge.knowledge_text.substring(
                                    0,
                                    300
                                  )}...`
                                : company.knowledge.knowledge_text}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              Last updated:{" "}
                              {formatDate(company.knowledge.created_at)}
                            </p>
                          </div>
                        ) : (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <p className="text-yellow-800">
                              No knowledge base configured
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Agents */}
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                          <span className="mr-2">🤖</span>
                          Agents ({company.agents?.length || 0})
                        </h4>
                        {company.agents && company.agents.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {company.agents.map((agent) => (
                              <div
                                key={agent.id}
                                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                              >
                                <div className="flex items-center space-x-3 mb-2">
                                  <span className="text-xl">🤖</span>
                                  <h5 className="font-semibold text-gray-800">
                                    {agent.name}
                                  </h5>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">
                                  {agent.description ||
                                    "No description provided"}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Created: {formatDate(agent.created_at)}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 text-center">
                            <p className="text-gray-500">No agents created</p>
                          </div>
                        )}
                      </div>

                      {/* Authority Members (Owners & Admins only) */}
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                          <span className="mr-2">👑</span>
                          Company Leadership
                        </h4>
                        {getAuthorityMembers(company.members).length > 0 ? (
                          <div className="space-y-2">
                            {getAuthorityMembers(company.members).map(
                              (member) => (
                                <div
                                  key={member.user_id}
                                  className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg border border-gray-200"
                                >
                                  <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                                      {member.email.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <span className="font-medium text-gray-700 block">
                                        {member.email}
                                      </span>
                                      <span className="text-sm text-gray-500">
                                        Can be contacted for company matters
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    {getRoleBadge(member.role)}
                                    {member.is_admin && (
                                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                                        Platform Admin
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        ) : (
                          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 text-center">
                            <p className="text-gray-500">
                              No owners or admins found
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-800 mb-3">
          🚨 Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-yellow-700 mb-2">
              <strong>Company Deletion:</strong> Permanently removes all company
              data including agents, knowledge, and conversations.
            </p>
          </div>
          <div>
            <p className="text-sm text-yellow-700">
              <strong>Data Export:</strong> Export platform data for analysis
              (Coming Soon).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboardPage;
