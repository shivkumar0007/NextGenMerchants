import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  API_BASE,
  addToCart,
  fallbackProducts,
  getCoins,
  getDiscountPercent,
  getGroupBuys,
  getGroupBuyDiscountPercent,
  getGroupBuyPrice,
  getGroupBuyProgress,
  getOriginalPrice,
  getPrimaryImage,
  getProductColors,
  getProductImages,
  getStoredUser,
  getWishlist,
  hasJoinedGroupBuy,
  joinGroupBuy,
  toggleWishlist,
} from "../utils/shop";

const formatPrice = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const ProductDetails = () => {
  const navigate = useNavigate();
  const { productId } = useParams();
  const [user] = useState(() => getStoredUser());
  const [products, setProducts] = useState(fallbackProducts);
  const [wishlist, setWishlist] = useState(getWishlist(user));
  const [groupBuys, setGroupBuys] = useState(getGroupBuys());
  const [coins] = useState(getCoins(user));
  const [selectedImage, setSelectedImage] = useState("");
  const [selectedColor, setSelectedColor] = useState("");

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await fetch(`${API_BASE}/products`);
        const data = await res.json();
        if (res.ok && Array.isArray(data) && data.length) {
          setProducts(data);
        }
      } catch (error) {
        console.error(error);
      }
    };

    loadProducts();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setGroupBuys(getGroupBuys());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const product = useMemo(
    () => products.find((item) => item._id === productId) || fallbackProducts[0],
    [productId, products]
  );

  const images = useMemo(() => getProductImages(product), [product]);
  const colors = useMemo(() => getProductColors(product), [product]);

  useEffect(() => {
    setSelectedImage(images[0] || getPrimaryImage(product));
  }, [images, product]);

  useEffect(() => {
    setSelectedColor(colors[0] || "");
  }, [colors, productId]);

  const related = useMemo(
    () =>
      products
        .filter((item) => item._id !== product._id && item.category === product.category)
        .slice(0, 3),
    [product, products]
  );

  const inWishlist = wishlist.includes(product._id);
  const groupState = getGroupBuyProgress(groupBuys[product._id]);
  const alreadyJoined = hasJoinedGroupBuy(user, product._id);
  const originalPrice = getOriginalPrice(product);
  const discountPercent = getDiscountPercent(product);
  const groupDiscount = getGroupBuyDiscountPercent(groupBuys[product._id]);
  const finalPrice = getGroupBuyPrice(product, groupBuys[product._id]);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#04030d_0%,#09061b_100%)] px-4 py-6 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="rounded-full border border-white/15 px-5 py-2 text-sm hover:bg-white/10"
          >
            Dashboard
          </button>
          <button
            onClick={() => navigate("/profile")}
            className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-5 py-2 text-sm text-cyan-100 hover:bg-cyan-400/20"
          >
            Profile
          </button>
        </div>

        <section className="grid gap-6 rounded-[32px] border border-white/10 bg-white/5 p-5 shadow-[0_24px_100px_rgba(5,8,20,0.45)] lg:grid-cols-[1fr_0.95fr] sm:p-6">
          <div className="space-y-4">
            <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#0d1024]">
              <img
                src={selectedImage || getPrimaryImage(product)}
                alt={product.name}
                className="h-[320px] w-full object-cover sm:h-[420px]"
              />
            </div>

            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {images.map((image) => (
                  <button
                    key={image}
                    onClick={() => setSelectedImage(image)}
                    className={`overflow-hidden rounded-2xl border ${
                      selectedImage === image
                        ? "border-cyan-400"
                        : "border-white/10"
                    } bg-[#0d1024]`}
                  >
                    <img
                      src={image}
                      alt={product.name}
                      className="h-20 w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/75">
                  {product.category || "Featured Product"}
                </p>
                {product.tryOnEnabled && (
                  <span className="rounded-full bg-cyan-400/15 px-3 py-1 text-xs font-semibold text-cyan-100">
                    Try-on Ready
                  </span>
                )}
              </div>

              <h1 className="mt-3 text-3xl font-semibold sm:text-5xl">{product.name}</h1>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <p className="text-2xl font-semibold text-cyan-100">
                  {formatPrice(finalPrice)}
                </p>
                <span className="text-base text-slate-500 line-through">
                  {formatPrice(originalPrice)}
                </span>
                <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-sm font-semibold text-emerald-200">
                  {groupDiscount ? discountPercent + groupDiscount : discountPercent}% OFF
                </span>
                {groupDiscount ? (
                  <span className="rounded-full bg-cyan-400/15 px-3 py-1 text-sm font-semibold text-cyan-100">
                    Group price live
                  </span>
                ) : null}
              </div>

              <p className="mt-5 text-sm leading-7 text-slate-300 sm:text-base">
                {product.description ||
                  "Detailed craftsmanship, standout value, and a premium shopping experience built around this item."}
              </p>

              {colors.length > 0 && (
                <div className="mt-6">
                  <p className="text-sm font-medium text-slate-300">Choose Color</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`rounded-full px-4 py-2 text-sm font-medium ${
                          selectedColor === color
                            ? "bg-cyan-400 text-slate-950"
                            : "border border-white/15 text-slate-200 hover:bg-white/10"
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 grid gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-[#0d1024] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Stock</p>
                  <p className="mt-2 text-lg font-semibold">{product.stock ?? 0}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#0d1024] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Delivery</p>
                  <p className="mt-2 text-lg font-semibold">2-4 days</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#0d1024] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Coins</p>
                  <p className="mt-2 text-lg font-semibold">You have {coins}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#0d1024] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Group Buy</p>
                  <p className="mt-2 text-lg font-semibold">{groupState.joined} joined</p>
                </div>
              </div>

              {product.tryOnEnabled && (
                <div className="mt-6 rounded-[24px] border border-emerald-400/20 bg-emerald-400/10 p-4">
                  <h3 className="text-lg font-semibold text-emerald-100">
                    Virtual Try-On Product
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-200">
                    This product is ready for virtual try-on integration. When you share
                    the overlay PNG and 3D sunglasses asset, the live try-on can fit
                    much more naturally using the stored calibration settings.
                  </p>
                  {product.tryOnOverlayImage ? (
                    <p className="mt-2 text-xs text-emerald-100/80">
                      Overlay image configured for live face fit.
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-amber-100/80">
                      Upload a transparent overlay PNG in admin for proper live face try-on.
                    </p>
                  )}
                </div>
              )}

              <div className="mt-6 rounded-[24px] border border-cyan-400/20 bg-cyan-400/10 p-4">
                <h3 className="text-lg font-semibold text-cyan-100">How Group Buy works</h3>
                <p className="mt-2 text-sm leading-6 text-slate-200">
                  Same product ko multiple shoppers join karte hain. Jab 5 users
                  complete ho jaate hain, tab best group-buy discount unlock hota hai.
                  Abhi{" "}
                  {groupState.remaining === 0
                    ? "deal unlocked hai aur discounted price upar visible hai."
                    : `${groupState.remaining} aur users chahiye.`}
                </p>
                {groupState.expiresAt ? (
                  <p className="mt-2 text-xs text-cyan-50/70">
                    Offer ends in{" "}
                    {Math.max(
                      Math.floor((groupState.expiresAt - Date.now()) / 60000),
                      0
                    )}{" "}
                    min
                  </p>
                ) : null}
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
                    style={{ width: `${groupState.progress}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => {
                  addToCart(user, {
                    ...product,
                    image: selectedImage || getPrimaryImage(product),
                    selectedColor,
                    price: finalPrice,
                    discountPercent: groupDiscount
                      ? discountPercent + groupDiscount
                      : discountPercent,
                  });
                  navigate("/profile");
                }}
                className="rounded-2xl bg-white px-5 py-4 font-semibold text-slate-950 hover:bg-slate-100"
              >
                Add to Cart
              </button>
              <button
                onClick={() => setWishlist(toggleWishlist(user, product._id))}
                className={`rounded-2xl border px-5 py-4 font-semibold ${
                  inWishlist
                    ? "border-rose-400/30 bg-rose-500/10 text-rose-100"
                    : "border-white/15 hover:bg-white/10"
                }`}
              >
                {inWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
              </button>
              <button
                onClick={() => setGroupBuys(joinGroupBuy(user, product._id).groups)}
                disabled={alreadyJoined}
                className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-5 py-4 font-semibold text-cyan-100 hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {alreadyJoined ? "Already Joined" : "Join Group Buy"}
              </button>
              {product.tryOnEnabled && (
                <button
                  onClick={() => navigate(`/try-on/${product._id}`)}
                  className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-4 font-semibold text-emerald-100 hover:bg-emerald-400/20"
                >
                  Open 3D Try-On
                </button>
              )}
              <button
                onClick={() => navigate("/profile")}
                className="rounded-2xl border border-white/15 px-5 py-4 font-semibold hover:bg-white/10"
              >
                View Cart and Checkout
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-white/5 p-5 sm:p-6">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/75">Similar Picks</p>
            <h2 className="mt-2 text-2xl font-semibold">You may also like</h2>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {related.map((item) => (
              <button
                key={item._id}
                onClick={() => navigate(`/product/${item._id}`)}
                className="overflow-hidden rounded-[24px] border border-white/10 bg-[#0d1024] text-left"
              >
                <img
                  src={getPrimaryImage(item)}
                  alt={item.name}
                  className="h-48 w-full object-cover"
                />
                <div className="p-4">
                  <h3 className="text-lg font-semibold">{item.name}</h3>
                  <p className="mt-1 text-sm text-slate-400">{item.category}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <p className="font-medium text-cyan-100">{formatPrice(item.price)}</p>
                    <span className="text-xs text-slate-500 line-through">
                      {formatPrice(getOriginalPrice(item))}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProductDetails;
