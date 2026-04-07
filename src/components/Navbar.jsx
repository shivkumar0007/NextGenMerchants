import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

const Navbar = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const token = localStorage.getItem("token");

  const handleAccess = () => {
    if (token) navigate("/dashboard");
    else navigate("/login");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 z-50 w-full border-b border-white/5 bg-black/30 px-6 py-4 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Link
          to="/"
          className="bg-gradient-to-r from-white to-gray-500 bg-clip-text text-2xl font-bold tracking-tighter text-transparent"
        >
          SHOPX <span className="text-purple-500">AI</span>
        </Link>

        <div className="hidden gap-8 text-sm text-gray-400 md:flex">
          <a href="#features" className="hover:text-white">
            Features
          </a>
          <a href="#explore" className="hover:text-white">
            Explore
          </a>
          <a href="#about" className="hover:text-white">
            About
          </a>
        </div>

        <div className="relative flex items-center gap-4">
          {!token ? (
            <>
              <button onClick={handleAccess} className="text-sm text-gray-300 hover:text-white">
                Login
              </button>

              <Link
                to="/signup"
                className="rounded-full bg-white px-5 py-2 text-sm font-bold text-black"
              >
                Sign Up
              </Link>
            </>
          ) : (
            <div className="relative">
              <div
                onClick={() => setOpen(!open)}
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-purple-600 font-bold"
              >
                U
              </div>

              {open && (
                <div className="absolute right-0 mt-3 w-48 rounded-lg border border-white/10 bg-black shadow-lg">
                  <button
                    onClick={() => navigate("/dashboard")}
                    className="w-full px-4 py-2 text-left hover:bg-white/10"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => navigate("/profile")}
                    className="w-full px-4 py-2 text-left hover:bg-white/10"
                  >
                    Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-red-400 hover:bg-white/10"
                  >
                    Logout
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
