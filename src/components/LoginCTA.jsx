import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const LoginCTA = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  return (
    <section id="about" className="px-6 py-24 text-center">
      <motion.div
        whileInView={{ scale: [0.95, 1], opacity: [0, 1] }}
        className="mx-auto max-w-5xl rounded-[3rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(240,179,91,0.22),transparent_35%),linear-gradient(135deg,rgba(9,14,25,0.95),rgba(14,18,34,0.95))] px-8 py-16"
      >
        <p className="text-sm uppercase tracking-[0.35em] text-[#f0b35b]">Start Shopping</p>
        <h2 className="mb-6 mt-4 font-['Space_Grotesk'] text-3xl font-bold md:text-5xl">
          Premium storefront ready hai, ab user flow complete karo
        </h2>
        <p className="mb-10 text-lg text-slate-300">
          Signup, login, dashboard, product previews aur homepage product discovery
          ab ek better connected ecommerce flow mein aligned hain.
        </p>
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <button
            onClick={() => navigate(token ? "/dashboard" : "/signup")}
            className="rounded-2xl bg-[#f0b35b] px-10 py-4 font-bold text-slate-950 transition-transform hover:scale-105"
          >
            {token ? "Open Dashboard" : "Get Started Now"}
          </button>
          <button
            onClick={() => navigate(token ? "/profile" : "/login")}
            className="rounded-2xl border border-white/15 px-10 py-4 font-bold transition-all hover:bg-white/10"
          >
            {token ? "Open Profile" : "Sign In"}
          </button>
        </div>
      </motion.div>
    </section>
  );
};

export default LoginCTA;
