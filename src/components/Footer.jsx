import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const Footer = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <footer className="relative border-t border-white/10 bg-[#050814] px-6 py-16 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h1 className="font-['Space_Grotesk'] text-3xl font-bold text-white">
              ShopX <span className="text-[#f0b35b]">AI</span>
            </h1>

            <p className="text-sm text-slate-400">
              AI-assisted discovery, ecommerce style homepage, aur cleaner user flow
              ek hi place par.
            </p>

            <p className="text-xs text-slate-500">Live in Beta</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}>
            <h4 className="mb-4 text-lg font-bold text-white">Quick Links</h4>

            {[
              ["Features", () => scrollToSection("features")],
              ["Shop", () => scrollToSection("shop")],
              ["Explore", () => scrollToSection("explore")],
              ["Dashboard", () => navigate(token ? "/dashboard" : "/login")],
            ].map(([label, action]) => (
              <button
                key={label}
                onClick={action}
                className="block py-1 text-left text-slate-400 hover:text-white"
              >
                {label}
              </button>
            ))}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}>
            <h4 className="mb-4 text-lg font-bold text-white">Company</h4>

            {[
              ["About", () => scrollToSection("about")],
              ["Careers", () => navigate("/signup")],
              ["Products", () => scrollToSection("shop")],
              ["Investors", () => scrollToSection("hero")],
            ].map(([label, action]) => (
              <button
                key={label}
                onClick={action}
                className="block py-1 text-left text-slate-400 hover:text-white"
              >
                {label}
              </button>
            ))}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}>
            <h4 className="mb-4 text-lg font-bold text-white">Contact</h4>

            <button
              onClick={() => window.open("mailto:hello@shopx.ai", "_self")}
              className="block text-sm text-slate-400 hover:text-white"
            >
              hello@shopx.ai
            </button>
            <button
              onClick={() => window.open("tel:+919876543210", "_self")}
              className="mt-2 block text-sm text-slate-400 hover:text-white"
            >
              +91 9876543210
            </button>

            <div className="mt-4 flex gap-4 text-sm text-white">
              <button
                onClick={() => navigate(token ? "/dashboard" : "/login")}
                className="transition hover:scale-110"
              >
                Shop
              </button>
              <button
                onClick={() => navigate(token ? "/profile" : "/signup")}
                className="transition hover:scale-110"
              >
                Profile
              </button>
              <button onClick={() => navigate("/login")} className="transition hover:scale-110">
                Login
              </button>
            </div>
          </motion.div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-sm text-slate-500">
          © 2026 ShopX AI. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
