import { motion } from "framer-motion";
import { ArrowRight, ShoppingBag, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fallbackProducts, getDiscountPercent, getOriginalPrice } from "../utils/shop";

const formatPrice = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const FeaturedProducts = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const featuredProducts = fallbackProducts.slice(0, 4);

  const handlePrimaryAction = (productId) => {
    if (token) {
      navigate(`/product/${productId}`);
      return;
    }

    navigate("/signup");
  };

  return (
    <section id="shop" className="mx-auto max-w-7xl px-6 py-24">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm uppercase tracking-[0.35em] text-[#f0b35b]">
            Featured Products
          </p>
          <h2 className="mt-3 font-['Space_Grotesk'] text-4xl font-bold text-white md:text-5xl">
            Homepage par real products ka premium storefront
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-300">
            Trending fashion, gadgets, audio aur lifestyle picks ready hain taaki
            landing page seedha ecommerce experience jaisa lage.
          </p>
        </div>

        <button
          onClick={() => navigate(token ? "/dashboard" : "/login")}
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-[#f0b35b]/60 hover:bg-white/10"
        >
          Open Full Catalog <ArrowRight size={16} />
        </button>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {featuredProducts.map((product, index) => {
          const discount = getDiscountPercent(product);
          const originalPrice = getOriginalPrice(product);

          return (
            <motion.article
              key={product._id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className="group overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.95),rgba(6,10,22,0.98))] shadow-[0_30px_90px_rgba(2,6,23,0.45)]"
            >
              <div className="relative overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-72 w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute left-4 top-4 rounded-full bg-black/65 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white backdrop-blur">
                  {product.category}
                </div>
                <div className="absolute right-4 top-4 rounded-full bg-[#f0b35b] px-3 py-1 text-xs font-bold text-slate-950">
                  {discount}% OFF
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-center gap-1 text-[#f0b35b]">
                  {Array.from({ length: 5 }).map((_, starIndex) => (
                    <Star key={`${product._id}-${starIndex}`} size={14} fill="currentColor" />
                  ))}
                  <span className="ml-2 text-xs font-medium text-slate-400">Top Rated</span>
                </div>

                <h3 className="mt-3 font-['Space_Grotesk'] text-2xl font-semibold text-white">
                  {product.name}
                </h3>
                <p className="mt-3 min-h-12 text-sm leading-6 text-slate-300">
                  {product.description}
                </p>

                <div className="mt-5 flex items-center gap-3">
                  <span className="text-2xl font-bold text-white">
                    {formatPrice(product.price)}
                  </span>
                  <span className="text-sm text-slate-500 line-through">
                    {formatPrice(originalPrice)}
                  </span>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => handlePrimaryAction(product._id)}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#f0b35b] px-4 py-3 font-semibold text-slate-950 transition hover:bg-[#f5c575]"
                  >
                    <ShoppingBag size={16} />
                    {token ? "View Product" : "Shop Now"}
                  </button>
                  <button
                    onClick={() => navigate(token ? "/dashboard" : "/login")}
                    className="rounded-2xl border border-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Explore
                  </button>
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
};

export default FeaturedProducts;
