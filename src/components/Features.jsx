import React from 'react';
import { motion } from 'framer-motion';
import { 
  Gift, Cpu, Mic, Glasses, Layers, Gamepad2, Video, Users 
} from 'lucide-react';

const featureList = [
  { icon: <Gift className="text-purple-400" />, title: "AI Gift Recommendation", desc: "Perfect gifts chosen by neural networks." },
  { icon: <Cpu className="text-blue-400" />, title: "AI Shopping Assistant", desc: "24/7 personal shopper at your fingertips." },
  { icon: <Mic className="text-pink-400" />, title: "Voice Search", desc: "Search the future with just your voice." },
  { icon: <Glasses className="text-cyan-400" />, title: "AR Try Before Buy", desc: "Virtually wear items using your camera." },
  { icon: <Layers className="text-orange-400" />, title: "Personalized Feed", desc: "A storefront that knows exactly what you love." },
  { icon: <Gamepad2 className="text-green-400" />, title: "Gamification", desc: "Spin, win, and earn points while you shop." },
  { icon: <Video className="text-red-400" />, title: "Short Video Shopping", desc: "Shop directly from viral reels." },
  { icon: <Users className="text-yellow-400" />, title: "Group Buying", desc: "Unlock massive discounts with friends." },
];

const Features = () => {
  return (
    <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-bold mb-4">Premium Features</h2>
        <p className="text-gray-500">Everything you need for the ultimate shopping experience.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {featureList.map((f, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -10, scale: 1.02 }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="p-8 rounded-[2rem] bg-white/5 border border-white/5 backdrop-blur-sm hover:border-purple-500/30 hover:bg-white/[0.07] transition-all group cursor-default"
          >
            <div className="mb-4 p-3 w-fit rounded-2xl bg-black/40 group-hover:scale-110 transition-transform">
              {f.icon}
            </div>
            <h3 className="text-lg font-bold mb-2">{f.title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default Features;