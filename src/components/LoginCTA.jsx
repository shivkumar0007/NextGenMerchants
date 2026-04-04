import React from 'react';
import { motion } from 'framer-motion';

const LoginCTA = () => {
  return (
    <section className="py-24 px-6 text-center">
      <motion.div 
        whileInView={{ scale: [0.95, 1], opacity: [0, 1] }}
        className="max-w-4xl mx-auto py-16 px-8 rounded-[3rem] bg-gradient-to-tr from-purple-600/20 to-blue-600/20 border border-white/10"
      >
        <h2 className="text-3xl md:text-5xl font-bold mb-6">Join the Future of Shopping Today</h2>
        <p className="text-gray-400 mb-10 text-lg">Be the first to experience AI-powered commerce.</p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button className="px-10 py-4 rounded-2xl bg-white text-black font-bold hover:scale-105 transition-transform">Get Started Now</button>
          <button className="px-10 py-4 rounded-2xl glass font-bold hover:bg-white/10 transition-all">Sign In</button>
        </div>
      </motion.div>
    </section>
  );
};

export default LoginCTA;