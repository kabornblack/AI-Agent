import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

function Layout({ children, userRole, isPlatformAdmin, companyName }) {
  const navigate = useNavigate();
  const location = useLocation();

  // State for sidebar and user data
  const [sidebarWidth, setSidebarWidth] = useState(256); // Default width (w-64 equivalent)
  const [isResizing, setIsResizing] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState(userRole || "member");
  const [platformAdmin, setPlatformAdmin] = useState(isPlatformAdmin || false);

  // Fetch user role and platform admin status if not provided
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");

        // Check if user is platform admin from localStorage
        const storedIsAdmin = localStorage.getItem("is_admin");
        const isPlatformAdminFromStorage = storedIsAdmin === "true";
        setPlatformAdmin(isPlatformAdminFromStorage);

        // Fetch companies to get user role
        const response = await fetch(`${API_BASE}/companies`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const companiesData = await response.json();
          if (companiesData.length > 0) {
            const role = companiesData[0].role || "member";
            setCurrentUserRole(role);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    if (!userRole && !isPlatformAdmin) {
      fetchUserData();
    } else {
      setCurrentUserRole(userRole || "member");
      setPlatformAdmin(isPlatformAdmin || false);
    }
  }, [userRole, isPlatformAdmin]);

  // Resize handlers
  const handleMouseDown = useCallback((e) => {
    setIsResizing(true);
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback(
    (e) => {
      if (!isResizing) return;

      const newWidth = e.clientX;
      // Min 200px, Max 500px for reasonable bounds
      if (newWidth >= 200 && newWidth <= 300) {
        setSidebarWidth(newWidth);
      }
    },
    [isResizing]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Add/remove global event listeners for resize
  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("is_admin");
    localStorage.removeItem("user_email");
    window.location.href = "/";
  };

  // Navigation items based on role
  const getNavigationItems = () => {
    const allItems = [
      { path: "/create-agent", label: "Create Agent", icon: "🤖" },
      { path: "/chat", label: "Chat with Agent", icon: "💬" },
      { path: "/manage-agents", label: "Manage Agents", icon: "⚙️" },
      { path: "/manage-users", label: "Manage Users", icon: "👥" },
      { path: "/chatbot-settings", label: "Chatbot Settings", icon: "🤖💬" },
      { path: "/admin", label: "Admin Dashboard", icon: "🛡️" },
    ];

    // Platform admin sees ONLY Admin Dashboard
    if (platformAdmin) {
      return allItems.filter(
        (item) => item.path === "/admin" || item.path === "/chatbot-settings"
      );
    }

    // Owner and Admin see: Create Agent, Chat with Agent, Manage Agents, Manage Users
    if (currentUserRole === "owner" || currentUserRole === "admin") {
      return allItems.filter(
        (item) =>
          item.path === "/create-agent" ||
          item.path === "/chat" ||
          item.path === "/manage-agents" ||
          item.path === "/manage-users" ||
          item.path === "/chatbot-settings"
      );
    }

    // Members only see Chat with Agent
    return allItems.filter((item) => item.path === "/chat");
  };

  const navigationItems = getNavigationItems();

  // Get display role
  const getDisplayRole = () => {
    if (platformAdmin) {
      return "Platform Admin";
    }

    switch (currentUserRole) {
      case "owner":
        return "Company Owner";
      case "admin":
        return "Company Admin";
      case "member":
        return "Team Member";
      default:
        return currentUserRole;
    }
  };

  // Redirect if user tries to access unauthorized pages
  useEffect(() => {
    const currentPath = location.pathname;
    const allowedPaths = navigationItems.map((item) => item.path);

    if (!allowedPaths.includes(currentPath) && navigationItems.length > 0) {
      navigate(navigationItems[0].path);
    }
  }, [location.pathname, navigationItems, navigate]);

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar with Resize Handle */}
      <div className="flex h-full">
        {/* Sidebar Content */}
        <div
          className="h-full bg-gray-300 flex flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          style={{ width: `${sidebarWidth}px` }}
        >
          {/* Header */}
          <div className="p-4 pt-20 bg-gray-300">
            <h1 className="text-xl font-bold text-gray-800 truncate">
              {companyName ? `${companyName}` : "My Agent"}
            </h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {navigationItems.map((item) => (
                <li key={item.path}>
                  <button
                    onClick={() => navigate(item.path)}
                    className={`w-full text-left rounded-lg transition-colors flex items-center px-4 py-3 space-x-3 ${
                      location.pathname === item.path
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "text-gray-700 hover:bg-gray-100 hover:border-gray-200 border border-transparent"
                    }`}
                  >
                    <span className="text-lg flex-shrink-0">{item.icon}</span>
                    <span className="font-medium truncate">{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Info Panel - Only show on Create Agent page for owners and admins */}
          {location.pathname === "/create-agent" &&
            (currentUserRole === "owner" || currentUserRole === "admin") &&
            !platformAdmin && (
              <div className="px-4 pb-4">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg border border-blue-200 p-4">
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-blue-900 mb-1">
                      AI Agent Builder 🚀
                    </h3>
                    <p className="text-blue-800 text-xs">
                      Create specialized AI assistants for:
                    </p>
                  </div>

                  <ul className="space-y-2 mb-4">
                    <li className="flex items-center text-blue-700 text-xs">
                      <span className="mr-2">•</span>
                      <span>Customer Support</span>
                    </li>
                    <li className="flex items-center text-blue-700 text-xs">
                      <span className="mr-2">•</span>
                      <span>HR & Onboarding</span>
                    </li>
                    <li className="flex items-center text-blue-700 text-xs">
                      <span className="mr-2">•</span>
                      <span>Payments & Transactions</span>
                    </li>
                    <li className="flex items-center text-blue-700 text-xs">
                      <span className="mr-2">•</span>
                      <span>Compliance & Verification</span>
                    </li>
                  </ul>

                  <div className="bg-blue-200 bg-opacity-50 rounded p-2 text-center">
                    <p className="text-blue-900 font-semibold text-xs">
                      No coding required!
                    </p>
                  </div>
                </div>
              </div>
            )}

          {/* User Info & Logout */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                Role:{" "}
                <span className="font-medium capitalize text-blue-900 border p-1 rounded-lg px-2 bg-blue-100">
                  {getDisplayRole()}
                </span>
              </p>
              <p className="text-xs text-gray-500 mt-1 truncate">
                {platformAdmin
                  ? "Full platform administration access"
                  : currentUserRole === "owner"
                  ? "Full company management access"
                  : currentUserRole === "admin"
                  ? "Company management access"
                  : "Basic access to chat with agents"}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="w-full bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center px-4 py-3 space-x-2"
            >
              <span>🔒</span>
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Resize Handle */}
        <div
          className={`w-1 bg-gray-300 hover:bg-blue-500 cursor-col-resize transition-colors ${
            isResizing ? "bg-blue-500" : ""
          }`}
          onMouseDown={handleMouseDown}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
}

export default Layout;
