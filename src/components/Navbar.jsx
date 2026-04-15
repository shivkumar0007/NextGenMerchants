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

  const scrollToSection = (id) => {
    setOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 z-50 w-full border-b border-white/10 bg-[rgba(7,10,20,0.72)] px-6 py-4 backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Link
          to="/"
          className="font-['Space_Grotesk'] text-2xl font-bold tracking-tight text-white"
        >
          SHOPX <span className="text-[#f0b35b]">AI</span>
        </Link>

        <div className="hidden gap-8 text-sm text-slate-300 md:flex">
          <button onClick={() => scrollToSection("features")} className="hover:text-white">
            Features
          </button>
          <button onClick={() => scrollToSection("shop")} className="hover:text-white">
            Shop
          </button>
          <button onClick={() => scrollToSection("explore")} className="hover:text-white">
            Explore
          </button>
          <button onClick={() => scrollToSection("about")} className="hover:text-white">
            About
          </button>
        </div>

        <div className="relative flex items-center gap-4">
          {!token ? (
            <>
              <button onClick={handleAccess} className="text-sm text-slate-200 hover:text-white">
                Login
              </button>

              <Link
                to="/signup"
                className="rounded-full bg-[#f0b35b] px-5 py-2 text-sm font-bold text-slate-950 transition hover:bg-[#f5c575]"
              >
                Sign Up
              </Link>
            </>
          ) : (
            <div className="relative">
              <div
                onClick={() => setOpen(!open)}
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#f0b35b] font-bold text-slate-950"
              >
                {JSON.parse(localStorage.getItem("user") || "{}")?.name?.[0] || "U"}
              </div>

              {open && (
                <div className="absolute right-0 mt-3 w-48 rounded-2xl border border-white/10 bg-[#09101d] p-2 shadow-lg">
                  <button
                    onClick={() => navigate("/dashboard")}
                    className="w-full rounded-xl px-4 py-2 text-left hover:bg-white/10"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => navigate("/profile")}
                    className="w-full rounded-xl px-4 py-2 text-left hover:bg-white/10"
                  >
                    Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full rounded-xl px-4 py-2 text-left text-red-400 hover:bg-white/10"
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
