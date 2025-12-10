import { motion } from "framer-motion";
import { Zap, Code2, Share2, BarChart3, Shield, Brain } from "lucide-react";

const FeaturesSection = () => {
  const features = [
    {
      icon: Zap,
      title: "5-Minute Setup",
      description:
        "Get your first AI agent running in under 5 minutes with our intuitive visual builder.",
      color: "rose",
      iconBg: "bg-rose-100",
      iconColor: "text-rose-600",
      borderColor: "border-rose-400",
      textColor: "text-rose-600",
    },
    {
      icon: BarChart3,
      title: "Real-Time Analytics",
      description:
        "Track performance, user satisfaction, and engagement with live dashboards.",
      color: "cyan",
      iconBg: "bg-cyan-100",
      iconColor: "text-cyan-600",
      borderColor: "border-cyan-400",
      textColor: "text-cyan-600",
    },
    {
      icon: Code2,
      title: "No Coding Required",
      description:
        "Build with natural language prompts. No technical skills or programming knowledge needed.",
      color: "amber",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      borderColor: "border-amber-400",
      textColor: "text-amber-600",
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description:
        "Bank-grade encryption with role-based access controls and compliance certifications.",
      color: "purple",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      borderColor: "border-purple-400",
      textColor: "text-purple-600",
    },
    {
      icon: Share2,
      title: "Multi-Platform Deploy",
      description:
        "Deploy instantly to website, Slack, Discord, or API. Reach customers wherever they are.",
      color: "emerald",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      borderColor: "border-emerald-400",
      textColor: "text-emerald-600",
    },
    {
      icon: Brain,
      title: "Continuous Learning",
      description:
        "Agents improve automatically with feedback and real-world interactions.",
      color: "orange",
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
      borderColor: "border-orange-400",
      textColor: "text-orange-600",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-white to-blue-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Everything You Need to Build Intelligent AI
          </h2>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
            Powerful features designed to help you build, deploy, and scale AI
            agents effortlessly
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -5, transition: { duration: 0.3 } }}
              className="group"
            >
              <div
                className={`bg-white rounded-2xl p-6 shadow-lg border-l-4 ${feature.borderColor} hover:shadow-xl transition-all duration-300 h-full`}
              >
                <div className="flex items-center mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl ${feature.iconBg} flex items-center justify-center mr-4`}
                  >
                    <feature.icon className={`w-6 h-6 ${feature.iconColor}`} />
                  </div>
                  <h3 className={`text-xl font-bold ${feature.textColor}`}>
                    {feature.title}
                  </h3>
                </div>
                <p className="text-gray-700">{feature.description}</p>
                {/* Optional hover link */}
                <div className="mt-4 pt-4 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span
                    className={`inline-flex items-center text-sm font-medium ${feature.textColor}`}
                  >
                    Learn more
                    <svg
                      className="ml-2 w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
