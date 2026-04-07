import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="relative border-t border-white/5 bg-black px-6 py-16 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h1 className="text-3xl font-bold">
              ShopX <span className="text-purple-500">AI</span>
            </h1>

            <p className="text-sm text-gray-400">
              AI + AR + Smart Shopping experience future ke liye
            </p>

            <p className="text-xs text-gray-500">Live in Beta</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}>
            <h4 className="mb-4 text-lg font-bold">Quick Links</h4>

            {[
              ["Features", () => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })],
              ["Explore", () => document.getElementById("explore")?.scrollIntoView({ behavior: "smooth" })],
              ["Dashboard", () => navigate("/dashboard")],
              ["Support", () => navigate("/profile")],
            ].map(([label, action]) => (
              <button
                key={label}
                onClick={action}
                className="block py-1 text-left text-gray-400 hover:text-white"
              >
                {label}
              </button>
            ))}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}>
            <h4 className="mb-4 text-lg font-bold">Company</h4>

            {[
              ["About", () => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })],
              ["Careers", () => navigate("/signup")],
              ["Products", () => navigate("/dashboard")],
              ["Investors", () => document.getElementById("hero")?.scrollIntoView({ behavior: "smooth" })],
            ].map(([label, action]) => (
              <button
                key={label}
                onClick={action}
                className="block py-1 text-left text-gray-400 hover:text-white"
              >
                {label}
              </button>
            ))}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}>
            <h4 className="mb-4 text-lg font-bold">Contact</h4>

            <button
              onClick={() => window.open("mailto:hello@shopx.ai", "_self")}
              className="block text-sm text-gray-400 hover:text-white"
            >
              hello@shopx.ai
            </button>
            <button
              onClick={() => window.open("tel:+919876543210", "_self")}
              className="mt-2 block text-sm text-gray-400 hover:text-white"
            >
              +91 9876543210
            </button>

            <div className="mt-4 flex gap-4">
              <button onClick={() => navigate("/dashboard")} className="transition hover:scale-110">
                Shop
              </button>
              <button onClick={() => navigate("/profile")} className="transition hover:scale-110">
                Profile
              </button>
              <button onClick={() => navigate("/login")} className="transition hover:scale-110">
                Login
              </button>
            </div>
          </motion.div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-sm text-gray-500">
          © 2026 ShopX AI. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
