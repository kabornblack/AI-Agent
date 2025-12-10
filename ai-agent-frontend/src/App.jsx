// src/App.jsx
import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import LoginPage from "./pages/Login";
import Layout from "./components/Layout";
import LandingPage from "./pages/LandingPage";
import ChatPage from "./pages/Chat";
import AdminDashboardPage from "./pages/AdminDashboard";
import CreateAgentPage from "./pages/CreateAgent";
import ManageAgentsPage from "./pages/ManageAgents";
import ManageUsersPage from "./pages/ManageUsers";
import ChatbotSettingsPage from "./pages/ChatbotSettingsPage";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
};

// Public Route Component (redirect to app if already logged in)
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return !token ? children : <Navigate to="/chat" replace />;
};

function App() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/companies`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const companies = await response.json();
        const firstCompany = companies[0];

        setUserData({
          role: firstCompany?.role || "member",
          isPlatformAdmin: localStorage.getItem("is_admin") === "true",
          companyName: firstCompany?.name,
        });
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("is_admin");
      }
    } catch (error) {
      console.error("Error checking auth:", error);
      localStorage.removeItem("token");
      localStorage.removeItem("is_admin");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* LANDING PAGE - Always accessible */}
        <Route path="/" element={<LandingPage />} />

        {/* LOGIN PAGE - Only accessible if not logged in */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage onLoginSuccess={checkAuth} />
            </PublicRoute>
          }
        />

        {/* PROTECTED ROUTES - With Layout */}
        <Route
          path="/create-agent"
          element={
            <ProtectedRoute>
              <Layout {...userData}>
                <CreateAgentPage {...userData} />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Layout {...userData}>
                <ChatPage {...userData} />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/manage-agents"
          element={
            <ProtectedRoute>
              <Layout {...userData}>
                <ManageAgentsPage {...userData} />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/manage-users"
          element={
            <ProtectedRoute>
              <Layout {...userData}>
                <ManageUsersPage {...userData} />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Layout {...userData}>
                <AdminDashboardPage {...userData} />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/chatbot-settings"
          element={
            <ProtectedRoute>
              <Layout {...userData}>
                <ChatbotSettingsPage {...userData} />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Catch all route - redirect to landing page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
