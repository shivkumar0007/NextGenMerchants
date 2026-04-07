import { motion } from "framer-motion";
import { ChevronRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section
      id="hero"
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pb-20 pt-32 text-center"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-6 flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-purple-400"
      >
        <Sparkles size={14} /> The Future is Here
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-6 bg-gradient-to-b from-white via-white to-gray-500 bg-clip-text text-5xl font-extrabold leading-[1.1] tracking-tight text-transparent md:text-8xl"
      >
        Future of <br /> Smart Shopping
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-10 max-w-2xl text-lg font-light leading-relaxed text-gray-400 md:text-xl"
      >
        Experience the intersection of{" "}
        <span className="font-medium text-white">AI Intelligence</span>,
        <span className="font-medium text-white"> AR Immersion</span>, and
        <span className="font-medium text-white"> Gamified Rewards</span> in one
        seamless platform.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col gap-4 sm:flex-row"
      >
        <button
          onClick={() => navigate("/signup")}
          className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-4 font-bold transition-all hover:shadow-[0_0_30px_rgba(168,85,247,0.4)]"
        >
          Get Started <ChevronRight size={18} />
        </button>
        <button
          onClick={() =>
            document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })
          }
          className="rounded-full border border-white/10 bg-white/5 px-8 py-4 font-bold backdrop-blur-md transition-all hover:bg-white/10"
        >
          Explore Features
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="mt-20 grid w-full max-w-5xl grid-cols-1 gap-4 opacity-70 transition-all duration-700 md:grid-cols-3 md:opacity-50 md:grayscale hover:grayscale-0"
      >
        <button
          onClick={() => navigate("/dashboard")}
          className="flex h-40 items-end rounded-2xl border border-white/5 bg-gradient-to-br from-purple-500/20 to-transparent p-4 text-left text-xs font-bold uppercase tracking-tighter"
        >
          AI Curated
        </button>
        <button
          onClick={() => navigate("/dashboard")}
          className="mt-0 flex h-52 items-end rounded-2xl border border-white/5 bg-gradient-to-br from-blue-500/20 to-transparent p-4 text-left text-xs font-bold uppercase tracking-tighter md:mt-[-20px]"
        >
          AR Fitting
        </button>
        <button
          onClick={() => navigate("/dashboard")}
          className="flex h-40 items-end rounded-2xl border border-white/5 bg-gradient-to-br from-purple-500/20 to-transparent p-4 text-left text-xs font-bold uppercase tracking-tighter"
        >
          Live Reels
        </button>
      </motion.div>
    </section>
  );
};

export default Hero;
