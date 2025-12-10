// src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

// Get admin emails from environment variable
const getAdminEmails = () => {
  const adminEmailsEnv =
    import.meta.env.VITE_ADMIN_EMAILS ||
    "founder@kaborntech.com,kaborn@kaborntech.com,admin@kaborntech.com,info@sales.com,info@info.com,urgent@urgent.com,mask@mask.com";
  return adminEmailsEnv
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email); // Remove empty strings
};

function LoginPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("login");

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);

  // Register form state
  const [companyName, setCompanyName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState("");

  // Helper function to check if email is admin
  const isAdminEmail = (email) => {
    const normalizedEmail = email.trim().toLowerCase();
    const adminEmails = getAdminEmails();
    return adminEmails.includes(normalizedEmail);
  };

  // 🔐 REAL LOGIN -> POST /api/login or /auth/admin-login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoading(true);

    if (!loginEmail || !loginPassword) {
      setLoginError("Email and password are required.");
      setLoading(false);
      return;
    }

    try {
      const isPlatformAdmin = isAdminEmail(loginEmail);

      // Use different endpoints based on email type
      const endpoint = isPlatformAdmin ? "/auth/admin-login" : "/auth/login";

      console.log(`Using endpoint: ${endpoint} for email: ${loginEmail}`);

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      if (!res.ok) {
        let msg = "Invalid credentials.";
        try {
          const data = await res.json();
          if (data && data.detail) {
            msg = data.detail;
          }
        } catch (_) {}
        setLoginError(msg);
      } else {
        const data = await res.json();
        const token = data.access_token;

        if (token) {
          localStorage.setItem("token", token);
          localStorage.setItem("is_admin", data.is_admin || "false");
          localStorage.setItem("user_email", loginEmail);

          console.log("✅ Login successful, redirecting...");
          console.log("User data:", data);

          // Role-based redirect
          let redirectPath = "/chat"; // default
          if (data.is_admin) {
            redirectPath = "/admin"; // platform admin
          } else if (data.role === "owner" || data.role === "admin") {
            redirectPath = "/create-agent"; // company admin/owner
          }

          console.log(`Redirecting to: ${redirectPath}`);
          navigate(redirectPath);
        }
      }
    } catch (err) {
      console.error(err);
      setLoginError("Network error while logging in. Is the API running?");
    } finally {
      setLoading(false);
    }
  };

  // 🏢 REAL REGISTER -> POST /api/register
  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError("");
    setRegSuccess("");
    setLoading(true);

    if (!companyName || !regEmail || !regPassword) {
      setRegError("All fields are required.");
      setLoading(false);
      return;
    }

    // Prevent admin emails from registering companies
    if (isAdminEmail(regEmail)) {
      setRegError(
        "Admin emails cannot register companies. Use the login tab instead."
      );
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/auth/register-company?company_name=${encodeURIComponent(
          companyName
        )}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: regEmail,
            password: regPassword,
          }),
        }
      );

      if (response.ok) {
        setRegSuccess("✅ Company & account created! You can now log in.");
        setRegEmail("");
        setRegPassword("");
        setCompanyName("");
      } else {
        const errorData = await response.json();
        setRegError(errorData.detail || "Registration failed.");
      }
    } catch (err) {
      console.error(err);
      setRegError("Network error. Is backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <main className="flex-1 px-16 pt-44">
        <div className="max-w-5xl mx-auto pt-4">
          {/* Title */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <span className="text-5xl">🔐</span>
              <span>Login or Register</span>
            </h1>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-8">
            <nav className="flex gap-8 text-sm">
              <button
                type="button"
                className={`pb-2 -mb-px border-b-2 transition-colors ${
                  activeTab === "login"
                    ? "border-sky-500 text-sky-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("login")}
              >
                Login
              </button>
              <button
                type="button"
                className={`pb-2 -mb-px border-b-2 transition-colors ${
                  activeTab === "register"
                    ? "border-sky-500 text-sky-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("register")}
              >
                Register Company
              </button>
            </nav>
          </div>

          {/* LOGIN TAB */}
          {activeTab === "login" && (
            <section className="max-w-3xl">
              <h2 className="text-xl font-semibold mb-6">
                Login to your account
              </h2>

              <form className="space-y-5" onSubmit={handleLogin}>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full rounded-md border border-gray-200 bg-gray-100 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="Enter your email"
                  />
                </div>

                {/* Admin hint (like in Streamlit) */}
                {loginEmail && isAdminEmail(loginEmail) && (
                  <div className="text-sm text-blue-700 bg-blue-50 border border-blue-100 rounded-md px-3 py-2">
                    🛡️ Platform admin detected. Use the shared admin password.
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    className="w-full rounded-md border border-gray-200 bg-gray-100 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                  />
                </div>

                {loginError && (
                  <div className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-md px-3 py-2">
                    {loginError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center rounded-md bg-sky-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-60 transition-colors"
                >
                  {loading ? "Logging in..." : "Login"}
                </button>
              </form>
            </section>
          )}

          {/* REGISTER TAB */}
          {activeTab === "register" && (
            <section className="max-w-3xl">
              <h2 className="text-xl font-semibold mb-6">
                Register your Company
              </h2>

              <form className="space-y-5" onSubmit={handleRegister}>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-md border border-gray-200 bg-gray-100 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Enter your company name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Work Email
                  </label>
                  <input
                    type="email"
                    className="w-full rounded-md border border-gray-200 bg-gray-100 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="Enter your work email"
                  />
                </div>

                {/* Admin warning (like in Streamlit) */}
                {regEmail && isAdminEmail(regEmail) && (
                  <div className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-3 py-2">
                    🛡️ This email is for platform admin access. Use the login
                    tab instead.
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    className="w-full rounded-md border border-gray-200 bg-gray-100 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Create a password"
                  />
                </div>

                {regError && (
                  <div className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-md px-3 py-2">
                    {regError}
                  </div>
                )}

                {regSuccess && (
                  <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-md px-3 py-2">
                    {regSuccess}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center rounded-md bg-sky-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-60 transition-colors"
                >
                  {loading ? "Registering..." : "Register Company"}
                </button>
              </form>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

export default LoginPage;
