import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  API_BASE,
  applyCoinsToTotal,
  fallbackProducts,
  getCart,
  getCartSummary,
  getCheckoutDetails,
  getCoins,
  getDiscountPercent,
  getGroupBuys,
  getGroupBuyProgress,
  getMissingCheckoutFields,
  getOriginalPrice,
  getPurchases,
  getSearchHistory,
  getStoredUser,
  getWishlistProducts,
  placeOrder,
  removeFromCart,
  saveCheckoutDetails,
  syncCartPrices,
  toggleWishlist,
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
  const [user] = useState(() => getStoredUser());
  const [products, setProducts] = useState(fallbackProducts);
  const [cartSummary, setCartSummary] = useState({ items: [], count: 0, total: 0 });
  const [cartItems, setCartItems] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [history, setHistory] = useState([]);
  const [groupBuys, setGroupBuys] = useState({});
  const [coins, setCoins] = useState(getCoins(user));
  const [coinsToUse, setCoinsToUse] = useState(0);
  const [checkoutDetails, setCheckoutDetails] = useState(getCheckoutDetails(user));
  const [checkoutError, setCheckoutError] = useState("");
  const [expandedPurchaseId, setExpandedPurchaseId] = useState(null);

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

  const wishlist = useMemo(
    () => getWishlistProducts(products, user),
    [products, user, cartSummary.count]
  );

  useEffect(() => {
    syncCartPrices(user, products);
    setCartSummary(getCartSummary(user));
    setCartItems(getCart(user));
    const nextPurchases = getPurchases(user);
    setPurchases(nextPurchases);
    setHistory(getSearchHistory(user));
    setCheckoutDetails(getCheckoutDetails(user));
    setCoins(getCoins(user));
    setExpandedPurchaseId((current) => current || nextPurchases[0]?.id || null);
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

  const coinSummary = applyCoinsToTotal(coinsToUse, cartSummary.total);

  const refreshCart = () => {
    setCartSummary(getCartSummary(user));
    setCartItems(getCart(user));
    setCoins(getCoins(user));
  };

  const handleCheckout = () => {
    const missingFields = getMissingCheckoutFields(checkoutDetails);
    if (missingFields.length) {
      setCheckoutError(`Please fill: ${missingFields.join(", ")}`);
      return;
    }

    const result = placeOrder(user, checkoutDetails, coinsToUse);
    if (result.error) {
      setCheckoutError(result.error);
      return;
    }

    setCheckoutError("");
    setPurchases(result.purchases);
    setCartItems(result.cart);
    setCartSummary(getCartSummary(user));
    setCheckoutDetails(result.checkoutDetails);
    setCoins(result.coins);
    setCoinsToUse(0);
    setExpandedPurchaseId(result.purchases[0]?.id || null);
  };

  const handleCheckoutField = (event) => {
    const { name, value } = event.target;
    const next = { ...checkoutDetails, [name]: value };
    setCheckoutDetails(next);
    saveCheckoutDetails(user, next);
    setCheckoutError("");
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
                {user?.email || "No email saved"} | Role: {user?.role || "user"}
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

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-[24px] border border-white/10 bg-[#0d1024] p-5">
            <p className="text-sm text-slate-400">Wishlist</p>
            <p className="mt-3 text-3xl font-semibold">{wishlist.length}</p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-[#0d1024] p-5">
            <p className="text-sm text-slate-400">Cart Items</p>
            <p className="mt-3 text-3xl font-semibold">{cartSummary.count}</p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-[#0d1024] p-5">
            <p className="text-sm text-slate-400">Purchases</p>
            <p className="mt-3 text-3xl font-semibold">{purchases.length}</p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-[#0d1024] p-5">
            <p className="text-sm text-slate-400">Cart Value</p>
            <p className="mt-3 text-3xl font-semibold">{formatPrice(cartSummary.total)}</p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-[#0d1024] p-5">
            <p className="text-sm text-slate-400">Coins</p>
            <p className="mt-3 text-3xl font-semibold">{coins}</p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold">Professional Cart</h2>
                <p className="text-sm text-slate-400">
                  Review items, quantity, discount, and final totals before placing the
                  order.
                </p>
              </div>
              <button
                onClick={handleCheckout}
                disabled={!cartItems.length}
                className="rounded-full bg-cyan-400 px-5 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Place Order
              </button>
            </div>

            {checkoutError && (
              <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                {checkoutError}
              </div>
            )}

            <div className="mt-5 space-y-3">
              {cartItems.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/15 px-4 py-8 text-center text-slate-400">
                  Your cart is empty right now.
                </div>
              )}

              {cartItems.map((item) => (
                <div
                  key={item.productId}
                  className="rounded-2xl border border-white/10 bg-[#0d1024] p-4"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-16 w-16 rounded-2xl object-cover"
                      />
                      <div>
                        <button
                          onClick={() => navigate(`/product/${item.productId}`)}
                          className="text-left text-lg font-semibold hover:text-cyan-100"
                        >
                          {item.name}
                        </button>
                        <p className="text-sm text-slate-400">
                          {item.category} | {formatPrice(item.price)} |{" "}
                          <span className="line-through">
                            {formatPrice(item.originalPrice)}
                          </span>{" "}
                          | {item.discountPercent}% OFF
                        </p>
                      </div>
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
                      <span className="min-w-24 text-right text-sm font-medium text-cyan-100">
                        {formatPrice(item.quantity * item.price)}
                      </span>
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
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-sm text-slate-300">Available Coins</p>
                  <p className="mt-1 text-xl font-semibold">{coins}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-300">Use Coins</p>
                  <input
                    type="number"
                    min="0"
                    max={coins}
                    value={coinsToUse}
                    onChange={(event) =>
                      setCoinsToUse(
                        Math.max(0, Math.min(coins, Number(event.target.value || 0)))
                      )
                    }
                    className="mt-1 w-full rounded-2xl border border-white/10 bg-[#0d1024] px-4 py-3 outline-none"
                  />
                </div>
                <div>
                  <p className="text-sm text-slate-300">Final Total</p>
                  <p className="mt-1 text-xl font-semibold">
                    {formatPrice(coinSummary.discountedTotal)}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 sm:p-6">
              <div>
                <h2 className="text-2xl font-semibold">Delivery Details</h2>
                <p className="mt-2 text-sm text-slate-400">
                  Fill all delivery details before placing an order.
                </p>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <input
                  name="fullName"
                  value={checkoutDetails.fullName}
                  onChange={handleCheckoutField}
                  placeholder="Full name"
                  className="rounded-2xl border border-white/10 bg-[#0d1024] px-4 py-3 outline-none"
                />
                <input
                  name="phone"
                  value={checkoutDetails.phone}
                  onChange={handleCheckoutField}
                  placeholder="Phone number"
                  className="rounded-2xl border border-white/10 bg-[#0d1024] px-4 py-3 outline-none"
                />
                <input
                  name="email"
                  value={checkoutDetails.email}
                  onChange={handleCheckoutField}
                  placeholder="Email"
                  className="rounded-2xl border border-white/10 bg-[#0d1024] px-4 py-3 outline-none md:col-span-2"
                />
                <textarea
                  name="address"
                  value={checkoutDetails.address}
                  onChange={handleCheckoutField}
                  placeholder="Full delivery address"
                  rows="4"
                  className="rounded-2xl border border-white/10 bg-[#0d1024] px-4 py-3 outline-none md:col-span-2"
                />
                <input
                  name="city"
                  value={checkoutDetails.city}
                  onChange={handleCheckoutField}
                  placeholder="City"
                  className="rounded-2xl border border-white/10 bg-[#0d1024] px-4 py-3 outline-none"
                />
                <input
                  name="state"
                  value={checkoutDetails.state}
                  onChange={handleCheckoutField}
                  placeholder="State"
                  className="rounded-2xl border border-white/10 bg-[#0d1024] px-4 py-3 outline-none"
                />
                <input
                  name="pincode"
                  value={checkoutDetails.pincode}
                  onChange={handleCheckoutField}
                  placeholder="Pincode"
                  className="rounded-2xl border border-white/10 bg-[#0d1024] px-4 py-3 outline-none"
                />
                <select
                  name="paymentMethod"
                  value={checkoutDetails.paymentMethod}
                  onChange={handleCheckoutField}
                  className="rounded-2xl border border-white/10 bg-[#0d1024] px-4 py-3 outline-none"
                >
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                  <option value="Cash on Delivery">Cash on Delivery</option>
                </select>
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
                    <div className="flex items-center gap-4">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-16 w-16 rounded-2xl object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <button
                          onClick={() => navigate(`/product/${product._id}`)}
                          className="truncate text-left font-semibold hover:text-cyan-100"
                        >
                          {product.name}
                        </button>
                        <p className="text-sm text-slate-400">
                          {product.category} | {formatPrice(product.price)} |{" "}
                          <span className="line-through">
                            {formatPrice(getOriginalPrice(product))}
                          </span>{" "}
                          | {getDiscountPercent(product)}% OFF
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          toggleWishlist(user, product._id);
                          setProducts([...products]);
                        }}
                        className="rounded-full border border-rose-400/30 px-4 py-2 text-sm text-rose-200"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
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
                  <button
                    onClick={() =>
                      setExpandedPurchaseId((current) =>
                        current === purchase.id ? null : purchase.id
                      )
                    }
                    className="flex w-full flex-col gap-2 text-left sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold">{purchase.id}</p>
                      <p className="text-sm text-slate-400">
                        {new Date(purchase.purchasedAt).toLocaleString()} |{" "}
                        {purchase.status}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-sm font-medium text-cyan-200">
                        {formatPrice(purchase.total)}
                      </p>
                      <p className="text-xs text-emerald-200">
                        Used {purchase.coinsUsed || 0} coins | Earned{" "}
                        {purchase.coinsEarned || 0}
                      </p>
                    </div>
                  </button>

                  {expandedPurchaseId === purchase.id && (
                    <div className="mt-3 space-y-3">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div className="rounded-2xl bg-white/5 p-3 text-sm text-slate-300">
                          <p className="font-medium text-white">Order Details</p>
                          <p className="mt-1">
                            Purchased: {new Date(purchase.purchasedAt).toLocaleString()}
                          </p>
                          <p>Status: {purchase.status}</p>
                          <p>Subtotal: {formatPrice(purchase.subtotal || purchase.total)}</p>
                          <p>Total Paid: {formatPrice(purchase.total)}</p>
                          <p>Payment: {purchase.customer?.paymentMethod || "UPI"}</p>
                        </div>
                        <div className="rounded-2xl bg-white/5 p-3 text-sm text-slate-300">
                          <p className="font-medium text-white">Delivery Details</p>
                          <p className="mt-1">{purchase.customer?.fullName}</p>
                          <p>{purchase.customer?.phone}</p>
                          <p>{purchase.customer?.email}</p>
                          <p>{purchase.customer?.address}</p>
                          <p>
                            {purchase.customer?.city}, {purchase.customer?.state}{" "}
                            {purchase.customer?.pincode}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-white/5 p-3 text-sm text-slate-300">
                        <p className="font-medium text-white">Purchased Products</p>
                        <div className="mt-3 space-y-3">
                          {purchase.items.map((item) => (
                            <button
                              key={`${purchase.id}-${item.productId}`}
                              onClick={() => navigate(`/product/${item.productId}`)}
                              className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-[#0d1024] p-3 text-left hover:border-cyan-300/30"
                            >
                              <img
                                src={item.image}
                                alt={item.name}
                                className="h-14 w-14 rounded-2xl object-cover"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-medium text-white">{item.name}</p>
                                <p className="text-xs text-slate-400">
                                  Qty {item.quantity} | {formatPrice(item.price)} each
                                </p>
                              </div>
                              <span className="text-sm font-medium text-cyan-100">
                                {formatPrice(item.price * item.quantity)}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 sm:p-6">
            <h2 className="text-2xl font-semibold">Recent Searches & Group Buy</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {history.length === 0 && (
                <span className="text-sm text-slate-400">No search history yet.</span>
              )}
              {history.map((term) => (
                <button
                  key={term}
                  onClick={() => navigate("/dashboard")}
                  className="rounded-full border border-white/15 bg-white/5 px-3 py-2 text-sm text-slate-200"
                >
                  {term}
                </button>
              ))}
            </div>

            <div className="mt-5 space-y-3">
              {products
                .filter((product) => groupBuys[product._id])
                .map((product) => {
                  const state = getGroupBuyProgress(groupBuys[product._id]);
                  return (
                    <div
                      key={product._id}
                      className="rounded-2xl border border-white/10 bg-[#0d1024] p-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h3 className="font-semibold">{product.name}</h3>
                          <p className="text-sm text-slate-400">
                            {state.joined} people joined
                          </p>
                        </div>
                        <span className="rounded-full bg-cyan-400/15 px-3 py-2 text-sm text-cyan-100">
                          {state.unlocked ? "Unlocked" : `${state.remaining} left`}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Profile;
