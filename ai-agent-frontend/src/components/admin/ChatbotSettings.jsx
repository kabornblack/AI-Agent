// src/components/admin/ChatbotSettings.jsx
import React, { useState, useEffect } from "react";
import {
  Save,
  Bot,
  Mail,
  Palette,
  Clock,
  Code,
  Globe,
  Copy,
  Settings,
} from "lucide-react";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

const ChatbotSettings = ({ companyId, userRole }) => {
  const [settings, setSettings] = useState({
    enabled: true,
    welcome_message: "Hello! I'm your AI assistant. How can I help you today?",
    support_email: "",
    theme_color: "#2563eb",
    working_hours: "9 AM - 6 PM, Monday to Friday",
    position: "bottom-right",
    collect_email: true,
  });

  const [embedCode, setEmbedCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [companyName, setCompanyName] = useState("");

  useEffect(() => {
    if (companyId) {
      fetchCompanyInfo();
      generateEmbedCode();
    }
  }, [companyId, settings]);

  const fetchCompanyInfo = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/companies`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const companies = await response.json();
        const company = companies.find((c) => c.id === parseInt(companyId));
        if (company) {
          setCompanyName(company.name);
          // Set default welcome message with company name
          setSettings((prev) => ({
            ...prev,
            welcome_message: `Hello! I'm the ${company.name} AI assistant. How can I help you today?`,
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching company info:", error);
    }
  };

  const generateEmbedCode = () => {
    const frontendUrl = window.location.origin;
    const code = `<!-- ${companyName} AI Chatbot -->
<script>
(function() {
  // Create chatbot container
  var container = document.createElement('div');
  container.id = 'ai-chatbot-${companyId}';
  container.style.cssText = 'position: fixed; ${getPositionStyle(
    settings.position
  )}; width: 400px; height: 600px; border: none; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); z-index: 9999; display: none;';
  
  // Create iframe
  var iframe = document.createElement('iframe');
  iframe.src = '${frontendUrl}/chatbot/embed/${companyId}?theme=${encodeURIComponent(
      settings.theme_color
    )}';
  iframe.style.cssText = 'width: 100%; height: 100%; border: none; border-radius: 12px;';
  iframe.allow = 'clipboard-write';
  
  container.appendChild(iframe);
  document.body.appendChild(container);

  // Create toggle button
  var button = document.createElement('button');
  button.innerHTML = '💬';
  button.style.cssText = 'position: fixed; ${getPositionStyle(
    settings.position
  )}; width: 60px; height: 60px; background: ${
      settings.theme_color
    }; color: white; border: none; border-radius: 50%; font-size: 24px; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.2); z-index: 9998; display: flex; align-items: center; justify-content: center;';
  
  button.onclick = function() {
    container.style.display = container.style.display === 'block' ? 'none' : 'block';
  };
  
  document.body.appendChild(button);
})();
</script>
<!-- End ${companyName} Chatbot -->`;

    setEmbedCode(code);
  };

  const getPositionStyle = (position) => {
    switch (position) {
      case "bottom-left":
        return "bottom: 20px; left: 20px;";
      case "top-right":
        return "top: 20px; right: 20px;";
      case "top-left":
        return "top: 20px; left: 20px;";
      default:
        return "bottom: 20px; right: 20px;";
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE}/companies/${companyId}/chatbot-settings`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(settings),
        }
      );

      if (response.ok) {
        setMessage("✅ Settings saved successfully!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("❌ Error saving settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage("❌ Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(embedCode);
    setMessage("📋 Embed code copied to clipboard!");
    setTimeout(() => setMessage(""), 3000);
  };

  const positions = [
    { value: "bottom-right", label: "Bottom Right" },
    { value: "bottom-left", label: "Bottom Left" },
    { value: "top-right", label: "Top Right" },
    { value: "top-left", label: "Top Left" },
  ];

  const themeColors = [
    { value: "#2563eb", label: "Blue" },
    { value: "#059669", label: "Green" },
    { value: "#7c3aed", label: "Purple" },
    { value: "#dc2626", label: "Red" },
    { value: "#ea580c", label: "Orange" },
  ];

  return (
    <div className="space-y-8">
      {/* Status Message */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.includes("✅")
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-blue-50 text-blue-700 border border-blue-200"
          }`}
        >
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Settings */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Settings className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Chatbot Configuration
                </h2>
                <p className="text-sm text-gray-600">
                  Customize your AI assistant
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Enable/Disable */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block font-medium text-gray-900 mb-1">
                    Enable Chatbot
                  </label>
                  <p className="text-sm text-gray-600">
                    Show chatbot on your website
                  </p>
                </div>
                <button
                  onClick={() =>
                    setSettings({ ...settings, enabled: !settings.enabled })
                  }
                  className="relative inline-flex h-6 w-11 items-center rounded-full"
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.enabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                  <span
                    className={`absolute inset-0 rounded-full transition-colors ${
                      settings.enabled ? "bg-green-500" : "bg-gray-300"
                    }`}
                  />
                </button>
              </div>

              {/* Welcome Message */}
              <div>
                <label className="block font-medium text-gray-900 mb-2">
                  Welcome Message
                </label>
                <textarea
                  value={settings.welcome_message}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      welcome_message: e.target.value,
                    })
                  }
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="What should the chatbot say when it starts?"
                />
              </div>

              {/* Support Email */}
              <div>
                <label className="block font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Support Email
                </label>
                <input
                  type="email"
                  value={settings.support_email}
                  onChange={(e) =>
                    setSettings({ ...settings, support_email: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="support@yourcompany.com"
                />
                <p className="text-sm text-gray-500 mt-2">
                  When the chatbot doesn't know an answer, it will forward
                  questions to this email
                </p>
              </div>

              {/* Theme Color */}
              <div>
                <label className="block font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Theme Color
                </label>
                <div className="grid grid-cols-5 gap-2 mb-3">
                  {themeColors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() =>
                        setSettings({ ...settings, theme_color: color.value })
                      }
                      className={`h-10 rounded-lg border-2 ${
                        settings.theme_color === color.value
                          ? "border-blue-500"
                          : "border-gray-300"
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.label}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg border border-gray-300"
                    style={{ backgroundColor: settings.theme_color }}
                  />
                  <input
                    type="text"
                    value={settings.theme_color}
                    onChange={(e) =>
                      setSettings({ ...settings, theme_color: e.target.value })
                    }
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                  />
                </div>
              </div>

              {/* Position */}
              <div>
                <label className="block font-medium text-gray-900 mb-2">
                  Position on Website
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {positions.map((pos) => (
                    <button
                      key={pos.value}
                      onClick={() =>
                        setSettings({ ...settings, position: pos.value })
                      }
                      className={`p-4 border rounded-lg text-center transition-all ${
                        settings.position === pos.value
                          ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                          : "border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                      }`}
                    >
                      {pos.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Working Hours */}
              <div>
                <label className="block font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Working Hours Message
                </label>
                <input
                  type="text"
                  value={settings.working_hours}
                  onChange={(e) =>
                    setSettings({ ...settings, working_hours: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="9 AM - 6 PM, Monday to Friday"
                />
              </div>

              {/* Email Collection */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block font-medium text-gray-900 mb-1">
                    Collect Email Addresses
                  </label>
                  <p className="text-sm text-gray-600">
                    Ask for email before answering complex questions
                  </p>
                </div>
                <button
                  onClick={() =>
                    setSettings({
                      ...settings,
                      collect_email: !settings.collect_email,
                    })
                  }
                  className="relative inline-flex h-6 w-11 items-center rounded-full"
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.collect_email ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                  <span
                    className={`absolute inset-0 rounded-full transition-colors ${
                      settings.collect_email ? "bg-blue-500" : "bg-gray-300"
                    }`}
                  />
                </button>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {saving ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Preview & Embed */}
        <div className="space-y-6">
          {/* Preview */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-100 rounded-lg">
                <Bot className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Live Preview
                </h2>
                <p className="text-sm text-gray-600">
                  See how your chatbot will look
                </p>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex justify-center mb-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl"
                  style={{ backgroundColor: settings.theme_color }}
                >
                  <Bot className="w-6 h-6" />
                </div>
              </div>

              <div className="space-y-3">
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <p className="text-sm text-gray-700">
                    {settings.welcome_message}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">10:00 AM</p>
                </div>

                <div className="bg-white rounded-lg p-3 border border-gray-200 ml-8">
                  <p className="text-sm text-gray-700">
                    Can you tell me about your services?
                  </p>
                  <p className="text-xs text-gray-500 mt-1">10:01 AM</p>
                </div>

                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <p className="text-sm text-gray-700">
                    Sure! I'd be happy to tell you about our services...
                  </p>
                  <p className="text-xs text-gray-500 mt-1">10:01 AM</p>
                </div>
              </div>
            </div>
          </div>

          {/* Embed Code */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Code className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Embed Code
                </h2>
                <p className="text-sm text-gray-600">Add to your website</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                <pre className="whitespace-pre-wrap text-xs">{embedCode}</pre>
              </div>

              <div className="space-y-3">
                <button
                  onClick={copyToClipboard}
                  className="w-full bg-gray-800 text-white py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Copy className="w-5 h-5" />
                  Copy Embed Code
                </button>

                <div className="text-sm text-gray-600 space-y-1">
                  <p className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    Copy the code above
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    Paste it before the closing &lt;/body&gt; tag
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    The chatbot will appear automatically
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2">
          <Globe className="w-5 h-5" />
          How to Add Chatbot to Your Website
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="text-3xl mb-2">1️⃣</div>
            <h4 className="font-medium text-blue-900">Copy the Code</h4>
            <p className="text-sm text-blue-700">
              Click "Copy Embed Code" above to copy the JavaScript code to your
              clipboard.
            </p>
          </div>
          <div className="space-y-2">
            <div className="text-3xl mb-2">2️⃣</div>
            <h4 className="font-medium text-blue-900">Paste in Your Website</h4>
            <p className="text-sm text-blue-700">
              Open your website's HTML and paste the code just before the
              closing &lt;/body&gt; tag.
            </p>
          </div>
          <div className="space-y-2">
            <div className="text-3xl mb-2">3️⃣</div>
            <h4 className="font-medium text-blue-900">Test It Out</h4>
            <p className="text-sm text-blue-700">
              Visit your website and look for the chatbot button. It should
              appear in the corner you selected!
            </p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-white rounded-lg border border-blue-300">
          <p className="text-sm text-blue-800">
            <strong>💡 Pro Tip:</strong> No coding needed! Just copy-paste. The
            chatbot will automatically:
            <br />
            • Appear as a floating button on your site
            <br />
            • Use your company's AI knowledge
            <br />
            • Match your brand colors
            <br />• Forward unanswered questions to your support email
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatbotSettings;
