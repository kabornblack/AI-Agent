import React, { useState, useEffect } from "react";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

function ManageUsersPage({ userRole, companyName }) {
  const [companies, setCompanies] = useState([]);
  const [currentCompany, setCurrentCompany] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingUser, setAddingUser] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "member",
  });

  // Fetch companies and users data
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

        // Set current company (first company for now)
        if (companiesData.length > 0) {
          setCurrentCompany(companiesData[0]);
          fetchCompanyUsers(companiesData[0].id);
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

  const fetchCompanyUsers = async (companyId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/companies/${companyId}/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const usersData = await response.json();
        setUsers(usersData);
      } else {
        console.error("Failed to fetch users");
        setUsers([]);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddUser = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      alert("Email and password are required.");
      return;
    }

    setAddingUser(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE}/companies/${currentCompany.id}/invite`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            role: formData.role,
          }),
        }
      );

      if (response.ok) {
        // Refresh users list
        await fetchCompanyUsers(currentCompany.id);

        // Reset form
        setFormData({
          email: "",
          password: "",
          role: "member",
        });

        alert(`User ${formData.email} added successfully as ${formData.role}!`);
      } else {
        const errorData = await response.json();
        alert(`Failed to add user: ${errorData.detail}`);
      }
    } catch (error) {
      console.error("Error adding user:", error);
      alert("Network error. Please try again.");
    } finally {
      setAddingUser(false);
    }
  };

  const handleDeleteUser = async (userId, userEmail, userRole) => {
    // Prevent users from deleting themselves
    const currentUserEmail = localStorage.getItem("user_email");
    if (userEmail === currentUserEmail) {
      alert("You cannot delete your own account.");
      return;
    }

    // Role-based deletion permissions
    if (userRole === "owner" && userRole !== "owner") {
      alert("Only the company owner can delete other owners.");
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to delete user "${userEmail}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE}/companies/${currentCompany.id}/users/${userId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        // Refresh users list
        await fetchCompanyUsers(currentCompany.id);
        alert(`User ${userEmail} deleted successfully!`);
      } else {
        const errorData = await response.json();
        alert(`Failed to delete user: ${errorData.detail}`);
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Network error. Please try again.");
    }
  };

  const canDeleteUser = (targetUserRole, targetUserEmail) => {
    const currentUserEmail = localStorage.getItem("user_email");

    // Cannot delete yourself
    if (targetUserEmail === currentUserEmail) {
      return false;
    }

    // Owner can delete anyone
    if (userRole === "owner") {
      return true;
    }

    // Admin can only delete members (not other admins or owners)
    if (userRole === "admin") {
      return targetUserRole === "member";
    }

    // Members cannot delete anyone
    return false;
  };

  const canCreateRole = (roleToCreate) => {
    // Owner can create any role
    if (userRole === "owner") {
      return true;
    }

    // Admin can only create members (not other admins or owners)
    if (userRole === "admin") {
      return roleToCreate === "member";
    }

    // Members cannot create anyone
    return false;
  };

  const getRoleOptions = () => {
    const options = [{ value: "member", label: "Member" }];

    if (userRole === "owner") {
      options.push(
        { value: "admin", label: "Admin" },
        { value: "owner", label: "Owner" }
      );
    } else if (userRole === "admin") {
      options.push({ value: "admin", label: "Admin" });
    }

    return options;
  };

  const getRoleBadge = (role) => {
    const badges = {
      owner: { color: "bg-purple-100 text-purple-800", label: "Owner" },
      admin: { color: "bg-blue-100 text-blue-800", label: "Admin" },
      member: { color: "bg-gray-100 text-gray-800", label: "Member" },
    };

    const badge = badges[role] || badges.member;
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}
      >
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-500 mt-2">Loading users...</p>
        </div>
      </div>
    );
  }

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

        <h2 className="text-2xl font-semibold text-gray-800/80">
          👥 Manage Company Users
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
        <div className="p-6">
          {/* Company Header */}
          {currentCompany && (
            <div className="mb-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🏢</span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {currentCompany.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Manage team members and their permissions
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Add User Form - Only for Owners and Admins */}
          {
            <div className="mb-8">
              <div className="border border-gray-200 rounded-lg">
                <div className="bg-gray-50 p-4 border-b border-gray-200 rounded-t-lg">
                  <h4 className="text-lg font-medium text-gray-800 flex items-center">
                    <span className="mr-2">➕</span>
                    Add a new team member
                  </h4>
                </div>

                <form onSubmit={handleAddUser} className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New User Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Enter email address"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Temporary Password
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Enter temporary password"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Assign Role
                      </label>
                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                        {userRole === "owner" && (
                          <option value="owner">Owner</option>
                        )}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={addingUser}
                      className="px-6 py-1 bg-blue-500 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {addingUser ? (
                        <div className="flex items-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Adding User...
                        </div>
                      ) : (
                        "Add User"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          }

          {/* Add User Form - Only for Owners and Admins */}
          {(userRole === "owner" || userRole === "admin") && (
            <div className="mb-8">
              <div className="border border-gray-200 rounded-lg">
                <div className="bg-gray-50 p-4 border-b border-gray-200 rounded-t-lg">
                  <h4 className="text-lg font-medium text-gray-800 flex items-center">
                    <span className="mr-2">➕</span>
                    Add a new team member
                  </h4>
                </div>

                <form onSubmit={handleAddUser} className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New User Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Enter email address"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Temporary Password
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Enter temporary password"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Role
                      </label>
                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {getRoleOptions().map((option) => (
                          <option
                            key={option.value}
                            value={option.value}
                            disabled={!canCreateRole(option.value)}
                          >
                            {option.label}
                            {!canCreateRole(option.value) && " (Not permitted)"}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={addingUser || !canCreateRole(formData.role)}
                      className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {addingUser ? (
                        <div className="flex items-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Adding User...
                        </div>
                      ) : (
                        "Add User"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Current Team Members */}
          <div>
            <h4 className="text-lg font-medium text-gray-800 mb-2 flex items-center">
              <span className="mr-2">👥</span>
              Current Team Members
            </h4>

            {users.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-4xl mb-4">👤</div>
                <p className="text-gray-600">No team members found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="border border-gray-200 rounded-lg p-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {user.email.charAt(0).toUpperCase()}
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">
                              {user.email}
                            </span>
                            {getRoleBadge(user.role)}
                          </div>
                          <p className="text-sm text-gray-500">
                            Joined:{" "}
                            {user.created_at
                              ? new Date(user.created_at).toLocaleDateString()
                              : "Unknown"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {/* Current user indicator */}
                        {user.email === localStorage.getItem("user_email") && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            You
                          </span>
                        )}

                        {/* Delete button */}
                        {canDeleteUser(user.role, user.email) && (
                          <button
                            onClick={() =>
                              handleDeleteUser(user.id, user.email, user.role)
                            }
                            className="px-3 py-1 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                          >
                            🗑️ Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Permissions Info */}
          {/* <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h5 className="font-medium text-yellow-800 mb-2">
              Permissions Guide
            </h5>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>
                • <strong>Owner:</strong> Can create/edit/delete any user and
                manage all company settings
              </li>
              <li>
                • <strong>Admin:</strong> Can create members and delete members
                (not other admins or owners)
              </li>
              <li>
                • <strong>Member:</strong> Can only view and chat with agents
              </li>
              <li>• Users cannot delete their own accounts</li>
            </ul>
          </div> */}
        </div>
      </div>
    </div>
  );
}

export default ManageUsersPage;
