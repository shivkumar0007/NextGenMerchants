import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const LoginCTA = () => {
  const navigate = useNavigate();

  return (
    <section id="about" className="px-6 py-24 text-center">
      <motion.div
        whileInView={{ scale: [0.95, 1], opacity: [0, 1] }}
        className="mx-auto max-w-4xl rounded-[3rem] border border-white/10 bg-gradient-to-tr from-purple-600/20 to-blue-600/20 px-8 py-16"
      >
        <h2 className="mb-6 text-3xl font-bold md:text-5xl">
          Join the Future of Shopping Today
        </h2>
        <p className="mb-10 text-lg text-gray-400">
          Be the first to experience AI-powered commerce.
        </p>
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <button
            onClick={() => navigate("/signup")}
            className="rounded-2xl bg-white px-10 py-4 font-bold text-black transition-transform hover:scale-105"
          >
            Get Started Now
          </button>
          <button
            onClick={() => navigate("/login")}
            className="glass rounded-2xl px-10 py-4 font-bold transition-all hover:bg-white/10"
          >
            Sign In
          </button>
        </div>
      </motion.div>
    </section>
  );
};

export default LoginCTA;
