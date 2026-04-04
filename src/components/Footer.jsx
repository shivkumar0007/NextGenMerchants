import React from "react";
import { motion } from "framer-motion";

const Footer = () => {
  return (
    <footer className="relative py-16 px-6 lg:px-12 border-t border-white/5 bg-black">
      
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

          {/* 🔥 Brand */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h1 className="text-3xl font-bold">
              ShopX <span className="text-purple-500">AI</span>
            </h1>

            <p className="text-gray-400 text-sm">
              AI + AR + Smart Shopping experience future ke liye 🚀
            </p>

            <p className="text-xs text-gray-500">🟢 Live in Beta</p>
          </motion.div>

          {/* 🔗 Links */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <h4 className="text-lg font-bold mb-4">⚡ Quick Links</h4>

            {["Features", "Pricing", "Blog", "Support"].map((item) => (
              <p
                key={item}
                className="text-gray-400 hover:text-white py-1 cursor-pointer"
              >
                {item}
              </p>
            ))}
          </motion.div>

          {/* 🏢 Company */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <h4 className="text-lg font-bold mb-4">🏢 Company</h4>

            {["About", "Careers", "Press", "Investors"].map((item) => (
              <p
                key={item}
                className="text-gray-400 hover:text-white py-1 cursor-pointer"
              >
                {item}
              </p>
            ))}
          </motion.div>

          {/* 📞 Contact */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <h4 className="text-lg font-bold mb-4">📞 Contact</h4>

            <p className="text-gray-400 text-sm">📧 hello@shopx.ai</p>
            <p className="text-gray-400 text-sm">📱 +91 9876543210</p>

            {/* Social */}
            <div className="flex gap-4 mt-4">
              <span className="hover:scale-110 transition">🐦</span>
              <span className="hover:scale-110 transition">📸</span>
              <span className="hover:scale-110 transition">💻</span>
            </div>
          </motion.div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/10 mt-10 pt-6 text-center text-gray-500 text-sm">
          © 2026 ShopX AI. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;