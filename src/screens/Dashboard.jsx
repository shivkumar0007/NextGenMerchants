import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  API_BASE,
  addToCart,
  fallbackProducts,
  filterProducts,
  getCart,
  getCartSummary,
  getCoins,
  getDiscountPercent,
  getGroupBuys,
  getGroupBuyDiscountPercent,
  getGroupBuyPrice,
  getGroupBuyProgress,
  hasJoinedGroupBuy,
  getOriginalPrice,
  getPurchases,
  getRecommendedProducts,
  getSearchHistory,
  getStoredUser,
  getWishlist,
  joinGroupBuy,
  pushSearchHistory,
  removeFromCart,
  syncCartPrices,
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
  const [user] = useState(() => getStoredUser());
  const [menuOpen, setMenuOpen] = useState(false);
  const [products, setProducts] = useState(fallbackProducts);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [wishlist, setWishlist] = useState(getWishlist(user));
  const [cartSummary, setCartSummary] = useState(getCartSummary(user));
  const [cartItems, setCartItems] = useState(getCart(user));
  const [purchases, setPurchases] = useState(getPurchases(user));
  const [history, setHistory] = useState(getSearchHistory(user));
  const [groupBuys, setGroupBuys] = useState(getGroupBuys());
  const [coins, setCoins] = useState(getCoins(user));

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

  const categories = useMemo(
    () => ["All", ...new Set(products.map((product) => product.category).filter(Boolean))],
    [products]
  );

  const searchedProducts = useMemo(
    () => filterProducts(products, search),
    [products, search]
  );
  const searchSuggestions = useMemo(
    () => (search.trim() ? searchedProducts.slice(0, 5) : []),
    [search, searchedProducts]
  );

  const filteredProducts = useMemo(
    () =>
      activeFilter === "All"
        ? searchedProducts
        : searchedProducts.filter((product) => product.category === activeFilter),
    [activeFilter, searchedProducts]
  );

  const wishlistProducts = useMemo(() => {
    const ids = new Set(wishlist);
    return products.filter((product) => ids.has(product._id));
  }, [products, wishlist]);

  const recommendedProducts = useMemo(
    () => getRecommendedProducts(products, history),
    [products, history]
  );

  const groupBuyProducts = useMemo(() => products.slice(0, 3), [products]);

  const refreshShopState = () => {
    setWishlist(getWishlist(user));
    setCartSummary(getCartSummary(user));
    setCartItems(getCart(user));
    setPurchases(getPurchases(user));
    setHistory(getSearchHistory(user));
    setGroupBuys(getGroupBuys());
    setCoins(getCoins(user));
  };

  const refreshCartState = () => {
    setCartSummary(getCartSummary(user));
    setCartItems(getCart(user));
    setCoins(getCoins(user));
  };

  useEffect(() => {
    syncCartPrices(user, products);
    refreshCartState();
    setWishlist(getWishlist(user));
    setPurchases(getPurchases(user));
    setHistory(getSearchHistory(user));
  }, [products, user]);

  useEffect(() => {
    const timer = setInterval(() => {
      const next = getGroupBuys();
      setGroupBuys((current) =>
        JSON.stringify(current) === JSON.stringify(next) ? current : next
      );
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setHistory(pushSearchHistory(user, search));
  };

  const handleWishlist = (productId) => {
    setWishlist(toggleWishlist(user, productId));
  };

  const handleAddToCart = (product) => {
    addToCart(user, product);
    refreshShopState();
  };

  const handleJoinGroupBuy = (productId) => {
    const result = joinGroupBuy(user, productId);
    setGroupBuys(result.groups);
    syncCartPrices(user, products);
    refreshCartState();
  };

  const renderProductCard = (product) => {
    const inWishlist = wishlist.includes(product._id);
    const groupState = getGroupBuyProgress(groupBuys[product._id]);
    const alreadyJoined = hasJoinedGroupBuy(user, product._id);
    const originalPrice = getOriginalPrice(product);
    const discountPercent = getDiscountPercent(product);
    const groupPrice = getGroupBuyPrice(product, groupBuys[product._id]);
    const groupDiscount = getGroupBuyDiscountPercent(groupBuys[product._id]);
    const displayPrice = groupDiscount ? groupPrice : Number(product.price || 0);

    return (
      <article
        key={product._id}
        className="flex h-full flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#0d1024] shadow-[0_24px_80px_rgba(5,8,20,0.45)]"
      >
        <button
          onClick={() => navigate(`/product/${product._id}`)}
          className="relative text-left"
        >
          <img
            src={product.image}
            alt={product.name}
            className="h-56 w-full object-cover"
          />
          <div className="absolute left-4 top-4 rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-cyan-100 backdrop-blur">
            {product.category || "Lifestyle"}
          </div>
        </button>

        <div className="flex flex-1 flex-col p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <button
                onClick={() => navigate(`/product/${product._id}`)}
                className="text-left text-xl font-semibold hover:text-cyan-100"
              >
                {product.name}
              </button>
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
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-2xl font-semibold">{formatPrice(displayPrice)}</p>
                <span className="text-sm text-slate-500 line-through">
                  {formatPrice(originalPrice)}
                </span>
                <span className="rounded-full bg-emerald-400/15 px-2 py-1 text-xs font-semibold text-emerald-200">
                  {groupDiscount ? discountPercent + groupDiscount : discountPercent}% OFF
                </span>
                {groupDiscount ? (
                  <span className="rounded-full bg-cyan-400/15 px-2 py-1 text-xs font-semibold text-cyan-100">
                    Group deal unlocked
                  </span>
                ) : null}
              </div>
              <p className="text-slate-400">Stock: {product.stock ?? "NA"}</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-right">
              <p className="font-semibold text-cyan-100">Group Buy Live</p>
              <p className="text-xs text-cyan-50/70">
                {groupState.unlocked
                  ? "Best group price is active now"
                  : `${groupState.joined} joined, ${groupState.remaining} more for best deal`}
              </p>
              {groupState.expiresAt ? (
                <p className="mt-1 text-[11px] text-cyan-50/60">
                  Ends in{" "}
                  {Math.max(
                    Math.floor((groupState.expiresAt - Date.now()) / 60000),
                    0
                  )}{" "}
                  min
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
              style={{ width: `${groupState.progress}%` }}
            />
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              onClick={() =>
                handleAddToCart({
                  ...product,
                  price: displayPrice,
                  discountPercent: groupDiscount
                    ? discountPercent + groupDiscount
                    : discountPercent,
                })
              }
              className="rounded-2xl bg-white px-4 py-3 font-semibold text-slate-950 hover:bg-slate-100"
            >
              Add to Cart
            </button>
            <button
              onClick={() => navigate(`/product/${product._id}`)}
              className="rounded-2xl border border-white/15 px-4 py-3 font-semibold hover:bg-white/10"
            >
              View Details
            </button>
            <button
              onClick={() => handleJoinGroupBuy(product._id)}
              disabled={alreadyJoined}
              className="rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-3 font-semibold text-cyan-50 hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {alreadyJoined ? "Joined" : "Join Group Buy"}
            </button>
            <button
              onClick={() => navigate("/profile")}
              className="rounded-2xl border border-white/15 px-4 py-3 font-semibold hover:bg-white/10"
            >
              Open Cart
            </button>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.12),_transparent_28%),linear-gradient(180deg,#04030d_0%,#09061b_100%)] px-4 py-5 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[32px] border border-white/10 bg-white/5 p-5 shadow-[0_30px_100px_rgba(3,6,18,0.45)] sm:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/80">
                Smart Commerce Hub
              </p>
              <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-5xl">
                Welcome back, {user?.name || "ShopX Shopper"}
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
                Search products, manage wishlist and cart, understand group-buy
                deals clearly, and use reward coins on your next order.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <form
                onSubmit={handleSearchSubmit}
                className="relative flex w-full max-w-xl flex-col gap-3 sm:flex-row"
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
                {searchSuggestions.length > 0 && (
                  <div className="absolute left-0 top-[calc(100%+0.5rem)] z-40 w-full overflow-hidden rounded-3xl border border-white/10 bg-[#0b1020] shadow-2xl sm:right-[7rem] sm:w-[calc(100%-7rem)]">
                    {searchSuggestions.map((product) => (
                      <button
                        key={product._id}
                        onClick={() => navigate(`/product/${product._id}`)}
                        className="flex w-full items-center gap-3 border-b border-white/5 px-4 py-3 text-left hover:bg-white/5 last:border-b-0"
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-12 w-12 rounded-2xl object-cover"
                        />
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-slate-400">{product.category}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </form>

              <div className="relative z-50">
                <button
                  onClick={() => setMenuOpen((open) => !open)}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-lg font-semibold uppercase text-slate-950"
                >
                  {user?.name?.[0] || "U"}
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-14 z-[60] min-w-56 rounded-3xl border border-white/10 bg-[#080b18] p-3 shadow-2xl">
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
                <button
                  key={product._id}
                  onClick={() => navigate(`/product/${product._id}`)}
                  className="rounded-[24px] border border-white/10 bg-[#0d1024] p-4 text-left"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-24 w-24 rounded-2xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-semibold">{product.name}</h3>
                      <p className="mt-1 text-sm text-slate-400">{product.description}</p>
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
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[30px] border border-white/10 bg-white/5 p-5 sm:p-6">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/70">
              Group Buy
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Easy group-buy explanation</h2>
            <p className="mt-2 text-sm text-slate-300">
              Same product ko multiple users milkar join karte hain. Target complete
              hote hi better discount unlock hota hai. Join karne ke baad cart se
              normal checkout hi hota hai.
            </p>

            <div className="mt-5 space-y-3">
              {groupBuyProducts.map((product) => {
                const state = getGroupBuyProgress(groupBuys[product._id]);
                const alreadyJoined = hasJoinedGroupBuy(user, product._id);
                return (
                  <div
                    key={product._id}
                    className="rounded-[24px] border border-white/10 bg-[#0d1024] p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-semibold">{product.name}</h3>
                        <p className="text-sm text-slate-400">
                          {state.joined} joined • {state.unlocked
                            ? "15% extra group-buy discount unlocked"
                            : `${state.remaining} more users for 15% off`}
                        </p>
                        {state.expiresAt ? (
                          <p className="text-xs text-slate-500">
                            Expires in{" "}
                            {Math.max(
                              Math.floor((state.expiresAt - Date.now()) / 60000),
                              0
                            )}{" "}
                            min
                          </p>
                        ) : null}
                      </div>
                      <button
                        onClick={() => handleJoinGroupBuy(product._id)}
                        disabled={alreadyJoined}
                        className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {alreadyJoined ? "Joined" : "Join"}
                      </button>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
                        style={{ width: `${state.progress}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <section className="rounded-[30px] border border-white/10 bg-white/5 p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/70">
                All Products
              </p>
              <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">
                {search.trim() ? "Results for your search" : "Curated catalog"}
              </h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveFilter(category)}
                  className={`rounded-full px-4 py-2 text-sm ${
                    activeFilter === category
                      ? "bg-cyan-400 text-slate-950"
                      : "border border-white/10 bg-white/5 text-slate-200"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <p className="mt-4 text-sm text-slate-400">
            {loading ? "Loading latest catalog..." : `${filteredProducts.length} products available`}
          </p>

          <div className="mt-6 grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
            {filteredProducts.map((product) => renderProductCard(product))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
