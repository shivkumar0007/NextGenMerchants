import React from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Features from "../components/Features";
import InteractiveSection from "../components/InteractiveSection";
import LoginCTA from "../components/LoginCTA";
import Footer from "../components/Footer";
import { motion } from "framer-motion";

function Home() {
  return (
    <div className="bg-[#030014] text-white min-h-screen overflow-x-hidden font-sans selection:bg-purple-500/30">

      {/* 🌌 Background Gradient Effects */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/20 blur-[120px] rounded-full animate-pulse" />

        {/* Extra glow */}
        <div className="absolute top-[30%] left-[40%] w-[300px] h-[300px] bg-pink-600/10 blur-[100px] rounded-full" />
      </div>

      {/* Navbar */}
      <Navbar />

      {/* Sections with smooth animation */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="pt-20"
      >
        <Hero />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <Features />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <InteractiveSection />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
      >
        <LoginCTA />
      </motion.div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default Home;