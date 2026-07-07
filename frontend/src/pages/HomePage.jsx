import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Brain, ShieldCheck, Sparkles, Database, FileCog, Menu, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 },
    },
  };

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Dashboard", href: "/Dashboard" },
    { name: "Team", href: "Team" },
    { name: "Login", href: "/Login", highlight: true },
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#0f172a] overflow-hidden">
      {/* Animated gradient blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-violet-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Navbar */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-20 sticky top-0 backdrop-blur-md bg-white/5 border-b border-white/10"
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent"
            >
              AI BI
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <motion.button
                    key={item.name}
                    whileHover={{ y: -2 }}
                    onClick={() => {
                      if (item.path.startsWith("/")) {
                        navigate(item.path);
                      }
                    }}
                    className={`text-sm font-medium transition-colors ${
                      item.highlight
                        ? "px-4 py-2 bg-gradient-to-r from-violet-500 to-indigo-600 rounded-lg text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl"
                                        : "text-gray-300 hover:text-white"
                    }`}
                  >
                    {item.name}
                  </motion.button>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-gray-300 hover:text-white focus:outline-none"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden mt-4 pb-4"
            >
             {navItems.map((item) => (
          <button
            key={item.name}
            onClick={() => {
              if (item.path.startsWith("/")) {
                navigate(item.path);
              }
              setIsMenuOpen(false);
           }}
            className={`block py-2 text-sm font-medium transition-colors ${
              item.highlight
                ? "px-4 py-2 bg-gradient-to-r from-violet-500 to-indigo-600 rounded-lg text-white inline-block mt-2"
                : "text-gray-300 hover:text-white"
            }`}
          >
           {item.name}
         </button>
        ))}
            </motion.div>
          )}
        </div>
      </motion.nav>

      {/* Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="text-center py-24 px-6 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 mb-8">
              <Sparkles size={18} className="text-yellow-300" />
              <span className="text-sm font-medium text-white/90">AI-Powered Analytics</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-violet-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent"
          >
            AI Business Intelligence Dashboard
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed"
          >
            Upload your business dataset and let AI analyze trends, forecast sales,
            detect trending products, and generate smart growth strategies.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <button
              onClick={() => navigate("/dashboard")}
             className="group relative px-8 py-3 bg-gradient-to-r from-violet-500 to-indigo-600 rounded-xl font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-300 hover:scale-105"
            >
              <span className="relative z-10">Get Started</span>
            </button>
          </motion.div>
        </section>

        {/* Features Section */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-4 gap-8 px-8 pb-20 max-w-6xl mx-auto"
        >
          <Feature
            icon={<BarChart3 size={32} />}
            title="Sales Forecasting"
            text="Predict future revenue using a custom-built Machine Learning regression model."
            gradient="from-violet-500 to-indigo-500"
          />
          <Feature
            icon={<TrendingUp size={32} />}
            title="Trend Detection"
            text="Automatically detect trending and declining products from last 30 days data."
            gradient="from-indigo-500 to-purple-500"
          />
          <Feature
            icon={<Brain size={32} />}
            title="AI Guidance"
            text="Receive intelligent business recommendations based on growth and volatility."
            gradient="from-purple-500 to-pink-500"
          />
          <Feature
            icon={<ShieldCheck size={32} />}
            title="Stability Analysis"
            text="Measure volatility and business health with statistical metrics."
            gradient="from-pink-500 to-rose-500"
          />
        </motion.div>

        {/* Dataset Rules Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-10 mx-6 md:mx-20 mb-20"
        >
          <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            📊 Dataset Requirements
          </h2>

          <div className="grid md:grid-cols-2 gap-8 text-gray-300">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
            >
              <h3 className="text-xl font-semibold mb-4 text-violet-400 flex items-center gap-2">
                <Database size={20} />
                Minimum Requirements
              </h3>
              <ul className="space-y-3">
                {[
                  "Minimum 30 rows of data required",
                  "Must contain a Date column",
                  "Must contain Sales / Revenue column",
                  "Data must be in CSV format",
                ].map((item, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-start gap-2"
                  >
                    <span className="text-violet-400 mt-1">•</span>
                    <span>{item}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
            >
              <h3 className="text-xl font-semibold mb-4 text-indigo-400 flex items-center gap-2">
                <FileCog size={20} />
                Advanced Intelligence Rules
              </h3>
              <ul className="space-y-3">
                {[
                  "Last 30 days used for trend detection",
                  "80% data used for training",
                  "20% data used for testing accuracy",
                  "Growth rate calculated from first to last entry",
                  "Volatility calculated using standard deviation",
                  "If product column exists → Product intelligence enabled",
                ].map((item, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-start gap-2"
                  >
                    <span className="text-indigo-400 mt-1">•</span>
                    <span>{item}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>
        </motion.div>

        {/* Footer */}
        <footer className="text-center text-gray-400 pb-10 border-t border-white/10 pt-8">
          <p>© 2026 AI Business Dashboard | Built with React + FastAPI + ML</p>
        </footer>
      </div>

      {/* Blob animation keyframes */}
      
    </div>
  );
}

function Feature({ icon, title, text, gradient }) {
  return (
    <motion.div
      variants={{
        hidden: { y: 20, opacity: 0 },
        visible: {
          y: 0,
          opacity: 1,
          transition: { type: "spring", stiffness: 100 },
        },
      }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="group relative bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300 shadow-lg"
    >
      {/* Gradient background on hover */}
      <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
      
      <div className="relative z-10">
        <div className={`text-transparent bg-gradient-to-br ${gradient} bg-clip-text mb-4`}>
          {icon}
        </div>
        <h3 className="text-lg font-semibold mb-2 text-white">{title}</h3>
        <p className="text-gray-400 text-sm leading-relaxed">{text}</p>
      </div>

      {/* Animated border glow */}
      <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}>
        <div className={`absolute inset-0 rounded-xl bg-gradient-to-r ${gradient} blur-md`} />
      </div>
    </motion.div>
  );
}