import React from 'react';
import { motion } from 'framer-motion';

const InteractiveSection = () => {
  return (
    <section className="py-24 px-6 bg-gradient-to-b from-transparent to-purple-900/10">
      <div className="max-w-7xl mx-auto rounded-[3rem] bg-white/5 border border-white/5 p-10 md:p-20 overflow-hidden relative">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight text-white">Experience Shopping <br/> Like Never Before</h2>
            <p className="text-gray-400 mb-8 max-w-md">Our interactive Reels UI allows you to browse live product demonstrations and checkout instantly without ever leaving the feed.</p>
            <ul className="space-y-4">
              {['One-tap checkout', 'Real-time stock alerts', 'Live AR overlays'].map(item => (
                <li key={item} className="flex items-center gap-3 text-sm font-medium text-gray-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500" /> {item}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="flex-1 flex justify-center">
            {/* Mock Reels Phone UI */}
            <motion.div 
              initial={{ rotate: 10, y: 40 }}
              whileInView={{ rotate: 0, y: 0 }}
              className="w-64 h-[450px] bg-black rounded-[3rem] border-[8px] border-white/10 relative overflow-hidden shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10 p-6 flex flex-col justify-end">
                <div className="w-10 h-10 rounded-full bg-gray-600 mb-4" />
                <div className="w-3/4 h-2 bg-white/20 rounded-full mb-2" />
                <div className="w-1/2 h-2 bg-white/20 rounded-full" />
              </div>
              <div className="w-full h-full bg-gradient-to-br from-purple-800 to-blue-900 animate-pulse" />
            </motion.div>
          </div>
        </div>
        
        {/* Glow behind the phone */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-600/20 blur-[100px] rounded-full" />
      </div>
    </section>
  );
};

export default InteractiveSection;