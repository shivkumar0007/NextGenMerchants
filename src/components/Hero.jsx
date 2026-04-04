import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Sparkles } from 'lucide-react';

const Hero = () => {
  return (
    <section className="relative pt-32 pb-20 px-6 flex flex-col items-center justify-center min-h-screen text-center overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-6 flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-400 text-xs font-bold uppercase tracking-widest"
      >
        <Sparkles size={14} /> The Future is Here
      </motion.div>

      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-5xl md:text-8xl font-extrabold tracking-tight mb-6 bg-gradient-to-b from-white via-white to-gray-500 bg-clip-text text-transparent leading-[1.1]"
      >
        Future of <br /> Smart Shopping
      </motion.h1>

      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="max-w-2xl text-gray-400 text-lg md:text-xl mb-10 font-light leading-relaxed"
      >
        Experience the intersection of <span className="text-white font-medium">AI Intelligence</span>, 
        <span className="text-white font-medium"> AR Immersion</span>, and 
        <span className="text-white font-medium"> Gamified Rewards</span> in one seamless platform.
      </motion.p>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <button className="px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 font-bold hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all flex items-center justify-center gap-2">
          Get Started <ChevronRight size={18} />
        </button>
        <button className="px-8 py-4 rounded-full bg-white/5 border border-white/10 backdrop-blur-md font-bold hover:bg-white/10 transition-all">
          Explore Features
        </button>
      </motion.div>

      {/* Hero Mockup Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="mt-20 w-full max-w-5xl grid grid-cols-3 gap-4 opacity-50 grayscale hover:grayscale-0 transition-all duration-700"
      >
        <div className="h-40 rounded-2xl bg-gradient-to-br from-purple-500/20 to-transparent border border-white/5 flex items-end p-4 font-bold text-xs uppercase tracking-tighter">AI Curated</div>
        <div className="h-52 rounded-2xl bg-gradient-to-br from-blue-500/20 to-transparent border border-white/5 mt-[-20px] flex items-end p-4 font-bold text-xs uppercase tracking-tighter">AR Fitting</div>
        <div className="h-40 rounded-2xl bg-gradient-to-br from-purple-500/20 to-transparent border border-white/5 flex items-end p-4 font-bold text-xs uppercase tracking-tighter">Live Reels</div>
      </motion.div>
    </section>
  );
};

export default Hero;