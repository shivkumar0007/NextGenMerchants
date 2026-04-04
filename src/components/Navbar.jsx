import React from 'react';
import { motion } from 'framer-motion';

const Navbar = () => {
  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 w-full z-50 px-6 py-4 backdrop-blur-md border-b border-white/5 bg-black/20"
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="text-2xl font-bold tracking-tighter bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
          SHOPX <span className="text-purple-500 underline decoration-purple-500/50 underline-offset-4">AI</span>
        </div>
        
        <div className="hidden md:flex gap-8 text-sm font-medium text-gray-400">
          {['Features', 'Explore', 'About'].map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`} className="hover:text-white transition-colors">
              {item}
            </a>
          ))}
        </div>

        <div className="flex gap-4 items-center">
          <button className="text-sm font-medium text-gray-300 hover:text-white">Login</button>
          <button className="px-5 py-2 rounded-full bg-white text-black text-sm font-bold hover:bg-gray-200 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
            Sign Up
          </button>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;