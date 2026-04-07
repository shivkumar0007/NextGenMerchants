import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  API_BASE,
  checkoutCart,
  fallbackProducts,
  getCartSummary,
  getGroupBuys,
  getPurchases,
  getSearchHistory,
  getStoredUser,
  getWishlistProducts,
  removeFromCart,
  updateCartQuantity,
} from "../utils/shop";

const formatPrice = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const Profile = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState(fallbackProducts);
  const [wishlist, setWishlist] = useState([]);
  const [cart, setCart] = useState({ items: [], count: 0, total: 0 });
  const [purchases, setPurchases] = useState([]);
  const [history, setHistory] = useState([]);
  const [groupBuys, setGroupBuys] = useState({});

  const [user] = useState(() => getStoredUser());

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch(`${API_BASE}/products`);
        const data = await response.json();
        if (response.ok && Array.isArray(data) && data.length) {
          setProducts(data);
        }
      } catch (error) {
        console.error(error);
      }
    };

    loadProducts();
  }, []);

  useEffect(() => {
    setWishlist(getWishlistProducts(products, user));
    setCart(getCartSummary(user));
    setPurchases(getPurchases(user));
    setHistory(getSearchHistory(user));
    setGroupBuys(getGroupBuys());
  }, [products, user]);

  const refreshCart = () => {
    setCart(getCartSummary(user));
  };

  const handleCheckout = () => {
    const result = checkoutCart(user);
    setPurchases(result.purchases);
    setCart(getCartSummary(user));
  };

  return (
    <div className="min-h-screen bg-[#050014] px-4 py-6 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">
                User Profile
              </p>
              <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
                {user?.name || "ShopX Member"}
              </h1>
              <p className="mt-2 text-sm text-slate-300 sm:text-base">
                {user?.email || "No email saved"} • Role: {user?.role || "user"}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/dashboard")}
                className="rounded-full border border-white/15 px-5 py-2 text-sm font-medium hover:bg-white/10"
              >
                Dashboard
              </button>
              {user?.role === "admin" && (
                <button
                  onClick={() => navigate("/admin")}
                  className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-5 py-2 text-sm font-medium text-cyan-100 hover:bg-cyan-400/20"
                >
                  Admin Panel
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[24px] border border-white/10 bg-[#0d1024] p-5">
            <p className="text-sm text-slate-400">Wishlist</p>
            <p className="mt-3 text-3xl font-semibold">{wishlist.length}</p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-[#0d1024] p-5">
            <p className="text-sm text-slate-400">Cart Items</p>
            <p className="mt-3 text-3xl font-semibold">{cart.count}</p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-[#0d1024] p-5">
            <p className="text-sm text-slate-400">Purchases</p>
            <p className="mt-3 text-3xl font-semibold">{purchases.length}</p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-[#0d1024] p-5">
            <p className="text-sm text-slate-400">Cart Value</p>
            <p className="mt-3 text-3xl font-semibold">{formatPrice(cart.total)}</p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold">Cart</h2>
                <p className="text-sm text-slate-400">
                  Review items, adjust quantity, and checkout.
                </p>
              </div>
              <button
                onClick={handleCheckout}
                disabled={!cart.items.length}
                className="rounded-full bg-cyan-400 px-5 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Checkout
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {cart.items.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/15 px-4 py-8 text-center text-slate-400">
                  Your cart is empty right now.
                </div>
              )}

              {cart.items.map((item) => (
                <div
                  key={item.productId}
                  className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#0d1024] p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <h3 className="text-lg font-semibold">{item.name}</h3>
                    <p className="text-sm text-slate-400">
                      {item.category} • {formatPrice(item.price)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => {
                        updateCartQuantity(user, item.productId, item.quantity - 1);
                        refreshCart();
                      }}
                      className="h-9 w-9 rounded-full border border-white/15"
                    >
                      -
                    </button>
                    <span className="min-w-8 text-center text-sm font-medium">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => {
                        updateCartQuantity(user, item.productId, item.quantity + 1);
                        refreshCart();
                      }}
                      className="h-9 w-9 rounded-full border border-white/15"
                    >
                      +
                    </button>
                    <button
                      onClick={() => {
                        removeFromCart(user, item.productId);
                        refreshCart();
                      }}
                      className="rounded-full border border-rose-400/30 px-4 py-2 text-sm text-rose-200"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 sm:p-6">
              <h2 className="text-2xl font-semibold">Recent Searches</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {history.length === 0 && (
                  <span className="text-sm text-slate-400">
                    No search history yet.
                  </span>
                )}
                {history.map((term) => (
                  <span
                    key={term}
                    className="rounded-full border border-white/15 bg-white/5 px-3 py-2 text-sm text-slate-200"
                  >
                    {term}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 sm:p-6">
              <h2 className="text-2xl font-semibold">Wishlist</h2>
              <div className="mt-4 space-y-3">
                {wishlist.length === 0 && (
                  <p className="text-sm text-slate-400">
                    Save products to wishlist from the dashboard.
                  </p>
                )}
                {wishlist.map((product) => (
                  <div
                    key={product._id}
                    className="rounded-2xl border border-white/10 bg-[#0d1024] p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="font-semibold">{product.name}</h3>
                        <p className="text-sm text-slate-400">
                          {product.category}
                        </p>
                      </div>
                      <span className="text-sm font-medium text-cyan-200">
                        {formatPrice(product.price)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 sm:p-6">
            <h2 className="text-2xl font-semibold">Purchase History</h2>
            <div className="mt-4 space-y-4">
              {purchases.length === 0 && (
                <p className="text-sm text-slate-400">
                  Purchases will appear here after checkout.
                </p>
              )}

              {purchases.map((purchase) => (
                <div
                  key={purchase.id}
                  className="rounded-2xl border border-white/10 bg-[#0d1024] p-4"
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold">{purchase.id}</p>
                      <p className="text-sm text-slate-400">
                        {new Date(purchase.purchasedAt).toLocaleString()}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-cyan-200">
                      {formatPrice(purchase.total)}
                    </p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {purchase.items.map((item) => (
                      <span
                        key={`${purchase.id}-${item.productId}`}
                        className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300"
                      >
                        {item.name} x{item.quantity}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 sm:p-6">
            <h2 className="text-2xl font-semibold">Group Buy Activity</h2>
            <div className="mt-4 space-y-3">
              {Object.keys(groupBuys).length === 0 && (
                <p className="text-sm text-slate-400">
                  Join a group buy from the dashboard to see activity here.
                </p>
              )}
              {products
                .filter((product) => groupBuys[product._id])
                .map((product) => (
                  <div
                    key={product._id}
                    className="rounded-2xl border border-white/10 bg-[#0d1024] p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="font-semibold">{product.name}</h3>
                        <p className="text-sm text-slate-400">
                          {groupBuys[product._id]} people joined
                        </p>
                      </div>
                      <span className="rounded-full bg-cyan-400/15 px-3 py-2 text-sm text-cyan-100">
                        Save 12%
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Profile;
