import React from "react";
import { motion } from "framer-motion";
import Features from "../components/Features";
import FeaturedProducts from "../components/FeaturedProducts";
import Footer from "../components/Footer";
import Hero from "../components/Hero";
import InteractiveSection from "../components/InteractiveSection";
import LoginCTA from "../components/LoginCTA";
import Navbar from "../components/Navbar";

function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#040712] text-white selection:bg-[#f0b35b]/30">
      <div className="pointer-events-none fixed left-0 top-0 -z-10 h-full w-full overflow-hidden">
        <div className="absolute left-[-10%] top-[-8%] h-[40%] w-[40%] rounded-full bg-[#f0b35b]/12 blur-[150px]" />
        <div className="absolute bottom-[-12%] right-[-8%] h-[45%] w-[45%] rounded-full bg-cyan-500/12 blur-[140px]" />
        <div className="absolute left-[35%] top-[20%] h-[260px] w-[260px] rounded-full bg-emerald-400/8 blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:90px_90px] opacity-[0.06]" />
      </div>

      <Navbar />

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
        <FeaturedProducts />
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

      <Footer />
    </div>
  );
}

export default Home;
