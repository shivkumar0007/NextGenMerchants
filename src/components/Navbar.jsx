import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const Navbar = () => {
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const token = localStorage.getItem("token");

  // 🔥 smart redirect
  const handleAccess = () => {
    if (token) navigate("/dashboard");
    else navigate("/login");
  };

  // 🔥 logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 w-full z-50 px-6 py-4 backdrop-blur-md border-b border-white/5 bg-black/30"
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center">

        {/* LOGO */}
        <Link
          to="/"
          className="text-2xl font-bold tracking-tighter bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent"
        >
          SHOPX <span className="text-purple-500">AI</span>
        </Link>

        {/* MENU */}
        <div className="hidden md:flex gap-8 text-sm text-gray-400">
          <a href="#features" className="hover:text-white">Features</a>
          <a href="#explore" className="hover:text-white">Explore</a>
          <a href="#about" className="hover:text-white">About</a>
        </div>

        {/* 🔥 RIGHT SIDE */}
        <div className="flex items-center gap-4 relative">

          {!token ? (
            <>
              <button
                onClick={handleAccess}
                className="text-sm text-gray-300 hover:text-white"
              >
                Login
              </button>

              <Link
                to="/signup"
                className="px-5 py-2 rounded-full bg-white text-black text-sm font-bold"
              >
                Sign Up
              </Link>
            </>
          ) : (
            <div className="relative">

              {/* 👤 USER ICON */}
              <div
                onClick={() => setOpen(!open)}
                className="w-10 h-10 flex items-center justify-center bg-purple-600 rounded-full cursor-pointer font-bold"
              >
                U
              </div>

              {/* 🔥 DROPDOWN */}
              {open && (
                <div className="absolute right-0 mt-3 w-44 bg-black border border-white/10 rounded-lg shadow-lg">

                  <button
                    onClick={() => navigate("/dashboard")}
                    className="w-full px-4 py-2 hover:bg-white/10 text-left"
                  >
                    🏠 Dashboard
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-red-400 hover:bg-white/10 text-left"
                  >
                    🚪 Logout
                  </button>

                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;