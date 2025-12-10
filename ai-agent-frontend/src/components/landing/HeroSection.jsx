import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Zap, Users } from "lucide-react";

// Use public folder path instead of import
const heroBg = "/hero/hero-bg.jpg";

const HeroSection = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
  };

  const floatingVariants = {
    animate: {
      y: [-10, 10, -10],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  return (
    <section
      id="hero"
      className="relative min-h-[90vh] flex items-center overflow-hidden"
      style={{
        background: `linear-gradient(180deg, hsl(200, 100%, 98%) 0%, hsl(195, 90%, 96%) 50%, hsl(0, 0%, 100%) 100%)`,
      }}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-0 left-0 w-full h-full opacity-30"
          style={{
            background: `radial-gradient(circle at 20% 30%, hsl(220, 100%, 45%) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, hsl(210, 65%, 50%) 0%, transparent 50%),
              radial-gradient(circle at 50% 80%, hsl(205, 90%, 55%) 0%, transparent 50%)`,
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.4, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Decorative floating elements */}
        <motion.div
          className="absolute top-20 right-[10%] w-72 h-72 bg-primary/10 rounded-full blur-3xl"
          variants={floatingVariants}
          animate="animate"
        />
        <motion.div
          className="absolute bottom-20 left-[15%] w-96 h-96 bg-secondary/10 rounded-full blur-3xl"
          variants={floatingVariants}
          animate="animate"
          transition={{ delay: 1 }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        <motion.div
          className="text-center max-w-5xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Badge */}
          <motion.div variants={itemVariants} className="mb-8 inline-block">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/30 border border-primary/20 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                Powered by Google Gemini AI
              </span>
            </div>
          </motion.div>

          {/* Main heading */}
          <motion.h1
            variants={itemVariants}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
          >
            <span className="text-foreground">Create AI Agents</span>
            <br />
            <span className="text-gradient">In Minutes, Not Months</span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            variants={itemVariants}
            className="text-xl sm:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed"
          >
            Build intelligent AI assistants for customer support, HR, sales, and
            more.
            <span className="font-semibold text-foreground">
              {" "}
              No coding required.
            </span>
            <br />
            Enterprise-ready and infinitely scalable.
          </motion.p>

          {/* Stats/Features */}

          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto"
          >
            {[
              { icon: Zap, label: "5 min setup", value: "Lightning fast" },
              { icon: Users, label: "10K+ teams", value: "Trusted by" },
              { icon: Sparkles, label: "No code needed", value: "100% visual" },
            ].map((stat, index) => (
              <motion.div
                key={index}
                className="flex flex-col items-center gap-2 p-6 rounded-2xl bg-blue-500/30 glass hover:shadow-card transition-all duration-300"
                whileHover={{ y: -5 }}
              >
                <stat.icon className="w-8 h-8 text-primary mb-2" />
                <div className="text-2xl font-bold text-foreground">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto "
          >
            {[
              { icon: Zap, label: "5 min setup", value: "Lightning fast" },
              { icon: Users, label: "10K+ teams", value: "Trusted by" },
              { icon: Sparkles, label: "No code needed", value: "100% visual" },
            ].map((stat, index) => (
              <motion.div
                key={index}
                className="flex flex-col items-center gap-2 p-6 rounded-2xl glass hover:shadow-card transition-all duration-300"
                whileHover={{ y: -5 }}
              >
                <stat.icon className="w-8 h-8 text-primary mb-2" />
                <div className="text-2xl font-bold text-foreground">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div> */}

          {/* Product showcase */}
          <motion.div variants={itemVariants} className="mt-20 relative">
            <div className="relative max-w-5xl mx-auto">
              {/* Glow effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 rounded-3xl blur-3xl" />

              {/* Main card */}
              <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-elegant border border-white/20 p-3 sm:p-4">
                <div className="aspect-video bg-gradient-to-br from-muted via-background to-muted rounded-2xl flex items-center justify-center overflow-hidden">
                  <img
                    src={heroBg}
                    alt="AI Agent Builder Platform Preview"
                    className="w-full h-full object-cover opacity-60"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 backdrop-blur-sm">
                    <div className="text-7xl mb-6 animate-float">🤖</div>
                    <p className="text-xl font-semibold text-foreground mb-2">
                      See Your AI Agent in Action
                    </p>
                    <p className="text-muted-foreground max-w-md text-center px-4">
                      Watch how easy it is to build, train, and deploy
                      intelligent AI assistants
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Trust indicators */}
          <motion.div variants={itemVariants} className="mt-20">
            <p className="text-muted-foreground text-sm uppercase tracking-wider mb-8 font-medium">
              Trusted by innovative teams worldwide
            </p>
            <div className="flex flex-wrap justify-center items-center gap-12 opacity-50">
              {[
                "TechCorp",
                "StartupXYZ",
                "InnovateLabs",
                "GlobalBiz",
                "FutureAI",
              ].map((company) => (
                <div
                  key={company}
                  className="text-foreground font-bold text-lg hover:opacity-100 transition-opacity"
                >
                  {company}
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
