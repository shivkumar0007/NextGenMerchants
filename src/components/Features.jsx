import { motion } from "framer-motion";
import {
  ArrowRight,
  Cpu,
  Gamepad2,
  Gift,
  Glasses,
  Layers,
  Mic,
  Users,
  Video,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const featureList = [
  { icon: <Gift className="text-purple-400" />, title: "AI Gift Recommendation", desc: "Perfect gifts chosen by neural networks." },
  { icon: <Cpu className="text-blue-400" />, title: "AI Shopping Assistant", desc: "24/7 personal shopper at your fingertips." },
  { icon: <Mic className="text-pink-400" />, title: "Voice Search", desc: "Search the future with just your voice." },
  { icon: <Glasses className="text-cyan-400" />, title: "AR Try Before Buy", desc: "Virtually wear items using your camera." },
  { icon: <Layers className="text-orange-400" />, title: "Personalized Feed", desc: "A storefront that knows exactly what you love." },
  { icon: <Gamepad2 className="text-green-400" />, title: "Gamification", desc: "Spin, win, and earn points while you shop." },
  { icon: <Video className="text-red-400" />, title: "Short Video Shopping", desc: "Shop directly from viral reels." },
  { icon: <Users className="text-yellow-400" />, title: "Group Buying", desc: "Unlock massive discounts with friends." },
];

const Features = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const openFeatureFlow = () => {
    navigate(token ? "/dashboard" : "/login");
  };

  return (
    <section id="features" className="mx-auto max-w-7xl px-6 py-24">
      <div className="mb-16 text-center">
        <p className="text-sm uppercase tracking-[0.35em] text-[#f0b35b]">Why ShopX AI</p>
        <h2 className="mb-4 mt-4 font-['Space_Grotesk'] text-3xl font-bold md:text-5xl">
          Premium ecommerce features, clearly linked
        </h2>
        <p className="mx-auto max-w-2xl text-slate-400">
          Homepage se dashboard aur product journey tak har action ko sensible flow
          diya gaya hai, taaki UX broken na lage.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {featureList.map((feature, index) => (
          <motion.button
            key={feature.title}
            whileHover={{ y: -10, scale: 1.02 }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            onClick={openFeatureFlow}
            className="group rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-8 text-left backdrop-blur-sm transition-all hover:border-[#f0b35b]/35 hover:bg-white/[0.09]"
          >
            <div className="mb-4 w-fit rounded-2xl bg-black/40 p-3 transition-transform group-hover:scale-110">
              {feature.icon}
            </div>
            <h3 className="mb-2 text-lg font-bold">{feature.title}</h3>
            <p className="text-sm leading-relaxed text-gray-500">{feature.desc}</p>
            <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white">
              Explore flow <ArrowRight size={15} />
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  );
};

export default Features;
