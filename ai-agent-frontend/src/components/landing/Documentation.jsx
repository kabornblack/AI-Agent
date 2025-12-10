// Replace the entire Documentation component with this fixed version:

import { motion } from "framer-motion";
import {
  BookOpen,
  Rocket,
  Bot,
  Shield,
  Archive,
  HelpCircle,
} from "lucide-react";

const Documentation = () => {
  const sections = [
    {
      id: "getting-started",
      icon: Rocket,
      title: "Getting Started",
      color: "from-blue-500 to-blue-400", // Changed
      topics: [
        {
          title: "Register Your Company",
          description: "Create your company profile and knowledge base",
        },
        {
          title: "Dashboard Overview",
          description: "Navigate your AI agent management hub",
        },
        {
          title: "First Agent Setup",
          description: "Build your first AI assistant in 5 minutes",
        },
      ],
    },
    {
      id: "agent-management",
      icon: Bot,
      title: "Agent Management",
      color: "from-purple-500 to-blue-500", // Changed
      topics: [
        {
          title: "Creating Agents",
          description: "Define behavior with system prompts",
        },
        {
          title: "Knowledge Base",
          description: "Centralized company knowledge for all agents",
        },
        {
          title: "Agent Conversations",
          description: "Chat history and conversation management",
        },
      ],
    },
    {
      id: "permissions",
      icon: Shield,
      title: "Roles & Permissions",
      color: "from-blue-400 to-purple-500", // Changed
      topics: [
        {
          title: "Company Owner",
          description: "Full control over company and all resources",
        },
        {
          title: "Company Admin",
          description: "Manage agents and team members",
        },
        {
          title: "Team Member",
          description: "Chat with agents and view conversations",
        },
      ],
    },
  ];

  const quickLinks = [
    {
      icon: Rocket,
      title: "Getting Started",
      href: "#getting-started",
      color: "text-blue-600", // Changed
    },
    {
      icon: Bot,
      title: "Agent Management",
      href: "#agent-management",
      color: "text-purple-600", // Changed
    },
    {
      icon: Shield,
      title: "Permissions",
      href: "#permissions",
      color: "text-green-600", // Changed
    },
  ];

  return (
    <section
      id="documentation"
      className="py-24 bg-gradient-to-b from-gray-50 to-gray-100 relative overflow-hidden" // Changed
    >
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />{" "}
      {/* Changed */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 border border-blue-200 mb-6">
            {" "}
            {/* Changed */}
            <BookOpen className="w-4 h-4 text-blue-600" /> {/* Changed */}
            <span className="text-sm font-medium text-blue-600">
              {" "}
              {/* Changed */}
              Documentation
            </span>
          </div>

          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            <span className="text-gray-900">Everything You Need</span>{" "}
            {/* Changed */}
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              {" "}
              {/* Changed */}
              to Know
            </span>
          </h2>

          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {" "}
            {/* Changed */}
            Comprehensive guides for building, managing, and deploying AI agents
          </p>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {quickLinks.map((link, index) => (
            <motion.a
              key={index}
              href={link.href}
              whileHover={{ y: -5 }}
              className="group relative"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl opacity-0 group-hover:opacity-20 blur transition-all duration-300" />{" "}
              {/* Changed */}
              <div className="relative h-full bg-white rounded-2xl p-6 border border-gray-200 hover:border-blue-300 transition-all duration-300 shadow-sm hover:shadow-lg">
                {" "}
                {/* Changed */}
                <link.icon className={`w-10 h-10 ${link.color} mb-4`} />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {" "}
                  {/* Changed */}
                  {link.title}
                </h3>
                <p className="text-sm text-gray-500">Quick access guide</p>{" "}
                {/* Changed */}
              </div>
            </motion.a>
          ))}
        </motion.div>

        {/* Main Documentation Sections */}
        <div className="space-y-12">
          {sections.map((section, sectionIndex) => (
            <motion.div
              key={section.id}
              id={section.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: sectionIndex * 0.1 }}
              className="group"
            >
              <div className="relative">
                {/* Glow effect */}
                <div
                  className={`absolute -inset-4 bg-gradient-to-r ${section.color} rounded-3xl opacity-0 group-hover:opacity-10 blur-2xl transition-all duration-500`}
                />

                <div className="relative bg-white rounded-3xl border border-gray-200 p-8 sm:p-12 shadow-sm hover:shadow-lg transition-all duration-300">
                  {/* Section Header */}
                  <div className="flex items-center gap-4 mb-8">
                    <div
                      className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${section.color} shadow-lg`}
                    >
                      <section.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-3xl sm:text-4xl font-bold text-gray-900">
                      {section.title}
                    </h3>
                  </div>

                  {/* Topics Grid */}
                  <div className="grid gap-6">
                    {section.topics.map((topic, topicIndex) => (
                      <motion.div
                        key={topicIndex}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: topicIndex * 0.1 }}
                        className="flex gap-4 p-6 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors duration-300 border border-transparent hover:border-gray-300"
                      >
                        <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-gradient-to-br from-blue-500 to-purple-500" />
                        <div className="flex-1">
                          <h4 className="text-xl font-semibold text-gray-900 mb-2">
                            {topic.title}
                          </h4>
                          <p className="text-gray-600 leading-relaxed">
                            {topic.description}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Architecture Section */}
        {/* <motion.div
          className="mt-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        > */}
        {/* <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl border border-blue-100 p-8 sm:p-12">
            <div className="flex items-center gap-4 mb-8">
              <Archive className="w-10 h-10 text-blue-600" />
              <h3 className="text-3xl font-bold text-gray-900">
                Technical Stack
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                "FastAPI",
                "PostgreSQL",
                "React",
                "Tailwind CSS",
                "Google Gemini",
                "JWT Auth",
              ].map((tech, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  className="bg-white rounded-xl p-4 text-center border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300"
                >
                  <p className="font-semibold text-gray-900 text-sm">{tech}</p>{" "}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div> */}

        {/* FAQ Section */}
        <motion.div
          className="mt-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 border border-green-200 mb-6">
              <HelpCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">FAQ</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h3>
          </div>

          <div className="grid gap-6 max-w-7xl mx-auto">
            {[
              {
                q: "Is this really free?",
                a: "Yes! Core functionality remains free. Premium features may be introduced later.",
              },
              {
                q: "How many agents can I create?",
                a: "Unlimited! Create as many specialized agents as your organization needs.",
              },
              {
                q: "Is my data secure?",
                a: "Absolutely. All data is encrypted at rest and in transit with isolated company data.",
              },
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-blue-300 transition-all duration-300 shadow-sm hover:shadow-lg"
              >
                <h4 className="text-lg font-semibold text-gray-900 mb-3">
                  {faq.q}
                </h4>
                <p className="text-gray-600 leading-relaxed">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Footer CTA */}
        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <p className="text-gray-600 mb-6 text-lg">
            Need help or have questions?
          </p>
          <motion.a
            href="mailto:support@aiagentbuilder.com"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <HelpCircle className="w-5 h-5" />
            Contact Support
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
};

export default Documentation;
