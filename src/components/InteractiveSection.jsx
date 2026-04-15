import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { fallbackProducts } from "../utils/shop";

const InteractiveSection = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const previewProduct = fallbackProducts[1];

  const openHub = () => navigate(token ? "/dashboard" : "/login");
  const openPreview = () => navigate(token ? `/product/${previewProduct._id}` : "/signup");

  return (
    <section
      id="explore"
      className="bg-gradient-to-b from-transparent to-[#091423] px-6 py-24"
    >
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[3rem] border border-white/10 bg-[linear-gradient(135deg,rgba(8,15,28,0.96),rgba(18,14,33,0.92))] p-10 md:p-20">
        <div className="relative z-10 flex flex-col items-center gap-12 md:flex-row">
          <div className="flex-1">
            <p className="text-sm uppercase tracking-[0.35em] text-[#f0b35b]">
              Explore Experience
            </p>
            <h2 className="mb-6 mt-4 font-['Space_Grotesk'] text-4xl font-bold leading-tight text-white md:text-6xl">
              Experience Shopping <br /> Like Never Before
            </h2>
            <p className="mb-8 max-w-md text-slate-300">
              Product discovery, live preview, aur fast actions ko ek intentional
              ecommerce layout mein combine kiya gaya hai taaki first page se hi
              premium storefront feel aaye.
            </p>
            <ul className="space-y-4">
              {["One-tap checkout", "Real-time stock alerts", "Collection-led browsing"].map(
                (item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 text-sm font-medium text-gray-300"
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-purple-500" /> {item}
                  </li>
                )
              )}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={openHub}
                className="rounded-full bg-[#f0b35b] px-6 py-3 font-semibold text-slate-950 transition hover:bg-[#f5c575]"
              >
                Open Shopping Hub
              </button>
              <button
                onClick={openPreview}
                className="rounded-full border border-white/15 px-6 py-3 font-semibold hover:bg-white/10"
              >
                Preview Product Flow
              </button>
            </div>
          </div>

          <div className="flex flex-1 justify-center">
            <motion.div
              initial={{ rotate: 10, y: 40 }}
              whileInView={{ rotate: 0, y: 0 }}
              className="relative h-[470px] w-72 overflow-hidden rounded-[3rem] border-[8px] border-white/10 bg-black shadow-2xl"
            >
              <img
                src={previewProduct.image}
                alt={previewProduct.name}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 z-10 flex flex-col justify-between bg-gradient-to-t from-black via-black/15 to-transparent p-6">
                <div className="self-end rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white backdrop-blur">
                  Live Product Reel
                </div>
                <div>
                  <div className="mb-4 inline-flex rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-semibold text-emerald-100">
                    Fast moving
                  </div>
                  <div className="rounded-[24px] border border-white/10 bg-black/45 p-4 backdrop-blur">
                    <p className="font-semibold text-white">{previewProduct.name}</p>
                    <p className="mt-1 text-sm text-slate-300">{previewProduct.category}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-lg font-bold text-white">
                        Rs. {previewProduct.price}
                      </span>
                      <button
                        onClick={openPreview}
                        className="rounded-full bg-[#f0b35b] px-4 py-2 text-xs font-bold text-slate-950"
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f0b35b]/15 blur-[100px]" />
      </div>
    </section>
  );
};

export default InteractiveSection;
