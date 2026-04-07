import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  API_BASE,
  addToCart,
  fallbackProducts,
  filterProducts,
  getCartSummary,
  getGroupBuys,
  getPurchases,
  getRecommendedProducts,
  getSearchHistory,
  getStoredUser,
  getWishlist,
  joinGroupBuy,
  pushSearchHistory,
  toggleWishlist,
} from "../utils/shop";

const formatPrice = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const Dashboard = () => {
  const navigate = useNavigate();
  const user = getStoredUser();

  const [menuOpen, setMenuOpen] = useState(false);
  const [products, setProducts] = useState(fallbackProducts);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [wishlist, setWishlist] = useState(getWishlist(user));
  const [cart, setCart] = useState(getCartSummary(user));
  const [purchases, setPurchases] = useState(getPurchases(user));
  const [history, setHistory] = useState(getSearchHistory(user));
  const [groupBuys, setGroupBuys] = useState(getGroupBuys());

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/products`);
        const data = await response.json();

        if (response.ok && Array.isArray(data) && data.length) {
          setProducts(data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const filteredProducts = useMemo(
    () => filterProducts(products, search),
    [products, search]
  );

  const recommendedProducts = useMemo(
    () => getRecommendedProducts(products, history),
    [products, history]
  );

  const groupBuyProducts = useMemo(() => products.slice(0, 3), [products]);

  const refreshShopState = () => {
    setWishlist(getWishlist(user));
    setCart(getCartSummary(user));
    setPurchases(getPurchases(user));
    setHistory(getSearchHistory(user));
    setGroupBuys(getGroupBuys());
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const nextHistory = pushSearchHistory(user, search);
    setHistory(nextHistory);
  };

  const handleWishlist = (productId) => {
    setWishlist(toggleWishlist(user, productId));
  };

  const handleAddToCart = (product) => {
    addToCart(user, product);
    refreshShopState();
  };

  const handleBuyNow = (product) => {
    addToCart(user, product);
    navigate("/profile");
  };

  const handleJoinGroupBuy = (productId) => {
    setGroupBuys(joinGroupBuy(productId));
  };

  const renderProductCard = (product) => {
    const inWishlist = wishlist.includes(product._id);
    const groupCount = groupBuys[product._id] || 1;

    return (
      <article
        key={product._id}
        className="flex h-full flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#0d1024] shadow-[0_24px_80px_rgba(5,8,20,0.45)]"
      >
        <div className="relative">
          <img
            src={product.image}
            alt={product.name}
            className="h-56 w-full object-cover"
          />
          <div className="absolute left-4 top-4 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-cyan-100 backdrop-blur">
            {product.category || "Lifestyle"}
          </div>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold">{product.name}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {product.description || "Premium product curated for your next upgrade."}
              </p>
            </div>
            <button
              onClick={() => handleWishlist(product._id)}
              className={`rounded-full px-3 py-2 text-sm font-medium ${
                inWishlist
                  ? "bg-rose-500/20 text-rose-100"
                  : "bg-white/5 text-slate-300"
              }`}
            >
              {inWishlist ? "Saved" : "Wishlist"}
            </button>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
            <div>
              <p className="text-2xl font-semibold">{formatPrice(product.price)}</p>
              <p className="text-slate-400">Stock: {product.stock ?? "NA"}</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-right">
              <p className="font-semibold text-cyan-100">Group Buy Live</p>
              <p className="text-xs text-cyan-50/70">{groupCount} shoppers joined</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => handleAddToCart(product)}
              className="rounded-2xl bg-white px-4 py-3 font-semibold text-slate-950 hover:bg-slate-100"
            >
              Add to Cart
            </button>
            <button
              onClick={() => handleBuyNow(product)}
              className="rounded-2xl border border-white/15 px-4 py-3 font-semibold hover:bg-white/10"
            >
              Buy Now
            </button>
            <button
              onClick={() => handleJoinGroupBuy(product._id)}
              className="rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-3 font-semibold text-cyan-50 hover:bg-cyan-400/20"
            >
              Join Group Buy
            </button>
            <button
              onClick={() => navigate("/profile")}
              className="rounded-2xl border border-white/15 px-4 py-3 font-semibold hover:bg-white/10"
            >
              View in Profile
            </button>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.12),_transparent_28%),linear-gradient(180deg,#04030d_0%,#09061b_100%)] px-4 py-5 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-[32px] border border-white/10 bg-white/5 p-5 shadow-[0_30px_100px_rgba(3,6,18,0.45)] sm:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/80">
                Smart Commerce Hub
              </p>
              <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-5xl">
                Welcome back, {user?.name || "ShopX Shopper"}
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
                Search products, build your wishlist and cart, discover group-buy
                deals, and jump to your profile or admin workspace from one place.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <form
                onSubmit={handleSearchSubmit}
                className="flex w-full max-w-xl flex-col gap-3 sm:flex-row"
              >
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search for shoes, audio, smartwatch, fashion..."
                  className="w-full rounded-2xl border border-white/10 bg-[#090d1d] px-4 py-3 text-sm outline-none placeholder:text-slate-500 focus:border-cyan-300/40"
                />
                <button
                  type="submit"
                  className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950"
                >
                  Search
                </button>
              </form>

              <div className="relative">
                <button
                  onClick={() => setMenuOpen((open) => !open)}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-lg font-semibold uppercase text-slate-950"
                >
                  {user?.name?.[0] || "U"}
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-14 z-20 min-w-52 rounded-3xl border border-white/10 bg-[#080b18] p-3 shadow-2xl">
                    <button
                      onClick={() => navigate("/dashboard")}
                      className="w-full rounded-2xl px-4 py-3 text-left text-sm hover:bg-white/10"
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={() => navigate("/profile")}
                      className="w-full rounded-2xl px-4 py-3 text-left text-sm hover:bg-white/10"
                    >
                      Profile
                    </button>
                    {user?.role === "admin" && (
                      <button
                        onClick={() => navigate("/admin")}
                        className="w-full rounded-2xl px-4 py-3 text-left text-sm text-cyan-100 hover:bg-cyan-400/10"
                      >
                        Admin Panel
                      </button>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full rounded-2xl px-4 py-3 text-left text-sm text-rose-200 hover:bg-rose-500/10"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {history.length === 0 && (
              <span className="text-sm text-slate-400">
                Search history will keep your last 5 searches here.
              </span>
            )}
            {history.map((term) => (
              <button
                key={term}
                onClick={() => setSearch(term)}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
              >
                {term}
              </button>
            ))}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[26px] border border-white/10 bg-[#0d1024] p-5">
            <p className="text-sm text-slate-400">Wishlist</p>
            <p className="mt-3 text-3xl font-semibold">{wishlist.length}</p>
          </div>
          <div className="rounded-[26px] border border-white/10 bg-[#0d1024] p-5">
            <p className="text-sm text-slate-400">Cart Items</p>
            <p className="mt-3 text-3xl font-semibold">{cart.count}</p>
          </div>
          <div className="rounded-[26px] border border-white/10 bg-[#0d1024] p-5">
            <p className="text-sm text-slate-400">Purchase Orders</p>
            <p className="mt-3 text-3xl font-semibold">{purchases.length}</p>
          </div>
          <div className="rounded-[26px] border border-white/10 bg-[#0d1024] p-5">
            <p className="text-sm text-slate-400">Current Cart Value</p>
            <p className="mt-3 text-3xl font-semibold">{formatPrice(cart.total)}</p>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-[30px] border border-white/10 bg-white/5 p-5 sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/70">
                  Recommended for you
                </p>
                <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">
                  Search-aware picks
                </h2>
              </div>
              <button
                onClick={() => navigate("/profile")}
                className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium hover:bg-white/10"
              >
                Open Profile
              </button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {recommendedProducts.map((product) => (
                <div
                  key={product._id}
                  className="rounded-[24px] border border-white/10 bg-[#0d1024] p-4"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-24 w-24 rounded-2xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-semibold">{product.name}</h3>
                      <p className="mt-1 text-sm text-slate-400">
                        {product.description}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100">
                          {product.category}
                        </span>
                        <span className="text-sm font-medium">
                          {formatPrice(product.price)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[30px] border border-white/10 bg-white/5 p-5 sm:p-6">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/70">
              Group Buy
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Save more together</h2>
            <div className="mt-5 space-y-3">
              {groupBuyProducts.map((product) => (
                <div
                  key={product._id}
                  className="rounded-[24px] border border-white/10 bg-[#0d1024] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-semibold">
                        {product.name}
                      </h3>
                      <p className="text-sm text-slate-400">
                        {(groupBuys[product._id] || 1) + 2} needed to unlock extra discount
                      </p>
                    </div>
                    <button
                      onClick={() => handleJoinGroupBuy(product._id)}
                      className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950"
                    >
                      Join
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="rounded-[30px] border border-white/10 bg-white/5 p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/70">
                All Products
              </p>
              <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">
                {search.trim() ? "Results for your search" : "Curated catalog"}
              </h2>
            </div>
            <p className="text-sm text-slate-400">
              {loading ? "Loading latest catalog..." : `${filteredProducts.length} products available`}
            </p>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
            {filteredProducts.map((product) => renderProductCard(product))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
