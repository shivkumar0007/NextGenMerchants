import { motion } from "framer-motion";
import { BadgeCheck, ChevronRight, PlayCircle, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fallbackProducts } from "../utils/shop";

const Hero = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const spotlightProducts = fallbackProducts.slice(0, 3);
  const heroVideoUrl =
    "https://media.istockphoto.com/id/884005050/video/chief-industrial-engineer-has-meeting-with-management-and-executives-in-the-heavy-industry.mp4?s=mp4-640x640-is&k=20&c=J8Q_EAcGsoSqhFlajk6QVd-BX53V6sL7u7t1koxOKiQ=";

  const openPrimaryAction = () => {
    navigate(token ? "/dashboard" : "/signup");
  };

  const openSecondaryAction = () => {
    document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="hero"
      className="relative overflow-hidden px-6 pb-24 pt-32"
    >
      <div className="mx-auto grid min-h-[calc(100vh-8rem)] max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-[#f0b35b]/30 bg-[#f0b35b]/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.3em] text-[#f6c983]"
          >
            <Sparkles size={14} /> New Commerce Experience
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 font-['Space_Grotesk'] text-5xl font-extrabold leading-[1.02] tracking-tight text-white md:text-7xl"
          >
            Future of
            <span className="block bg-gradient-to-r from-white via-[#f6d9a3] to-[#f0b35b] bg-clip-text text-transparent">
              Smart Shopping
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 md:text-xl"
          >
            AI recommendations, premium product discovery, live media previews, aur
            conversion-focused shopping flow sab ek hi clean ecommerce experience
            mein.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-10 flex flex-col gap-4 sm:flex-row"
          >
            <button
              onClick={openPrimaryAction}
              className="flex items-center justify-center gap-2 rounded-full bg-[#f0b35b] px-8 py-4 font-bold text-slate-950 transition-all hover:shadow-[0_0_30px_rgba(240,179,91,0.35)]"
            >
              {token ? "Open Dashboard" : "Get Started"} <ChevronRight size={18} />
            </button>
            <button
              onClick={openSecondaryAction}
              className="rounded-full border border-white/10 bg-white/5 px-8 py-4 font-bold text-white backdrop-blur-md transition-all hover:bg-white/10"
            >
              Explore Products
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-10 grid gap-4 sm:grid-cols-3"
          >
            {[
              { label: "Fast Delivery", value: "24-48 hrs" },
              { label: "Live Deals", value: "Daily drops" },
              { label: "Secure Checkout", value: "100% safe" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur"
              >
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
                  {item.label}
                </p>
                <p className="mt-2 font-['Space_Grotesk'] text-2xl font-semibold text-white">
                  {item.value}
                </p>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.7 }}
          className="relative"
        >
          <div className="absolute -left-12 top-10 h-28 w-28 rounded-full bg-[#f0b35b]/20 blur-3xl" />
          <div className="absolute -right-10 bottom-8 h-36 w-36 rounded-full bg-cyan-500/20 blur-3xl" />

          <div className="relative overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(13,16,36,0.96),rgba(4,7,18,0.98))] p-4 shadow-[0_35px_110px_rgba(3,6,18,0.6)]">
            <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-4">
                <div className="overflow-hidden rounded-[24px]">
                  <img
                    src={spotlightProducts[0].image}
                    alt={spotlightProducts[0].name}
                    className="h-64 w-full object-cover"
                  />
                </div>

                <div className="mt-4">
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-100">
                    <BadgeCheck size={14} />
                    Best Seller
                  </div>
                  <h3 className="mt-4 font-['Space_Grotesk'] text-2xl font-semibold text-white">
                    {spotlightProducts[0].name}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {spotlightProducts[0].description}
                  </p>
                </div>

                <div className="mt-5 grid gap-3">
                  {spotlightProducts.slice(1).map((product) => (
                    <button
                      key={product._id}
                      onClick={() => navigate(token ? `/product/${product._id}` : "/login")}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0b1020] p-3 text-left transition hover:bg-white/10"
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-14 w-14 rounded-2xl object-cover"
                      />
                      <div>
                        <p className="font-medium text-white">{product.name}</p>
                        <p className="text-xs text-slate-400">{product.category}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="overflow-hidden rounded-[28px] border border-white/10 bg-black">
                  <video
                    className="h-[320px] w-full object-cover"
                    src={heroVideoUrl}
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                    <div className="flex items-center gap-2 text-[#f0b35b]">
                      <PlayCircle size={18} />
                      <span className="text-sm font-semibold uppercase tracking-[0.2em]">
                        Live Preview
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-300">
                      Hero section ke right side par auto-loop video embed hai jo storefront
                      ko dynamic aur premium feel deta hai.
                    </p>
                  </div>

                  <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
                      Conversion Ready
                    </p>
                    <p className="mt-3 font-['Space_Grotesk'] text-3xl font-bold text-white">
                      4+ demo
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      Featured products, safe CTAs, aur proper product discovery flow.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
