export const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? "http://localhost:5000/api"
    : "https://nextgen-backend-y4fj.onrender.com/api");

export const fallbackProducts = [
  {
    _id: "fallback-1",
    name: "Nimbus Hoodie",
    price: 1499,
    originalPrice: 1999,
    discountPercent: 25,
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80",
    description: "Soft heavyweight hoodie for all-day comfort and streetwear layering.",
    category: "Fashion",
    stock: 18,
  },
  {
    _id: "fallback-2",
    name: "Pulse Runner",
    price: 2799,
    originalPrice: 3599,
    discountPercent: 22,
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80",
    description: "Breathable running shoes with cushioned midsoles and fast everyday style.",
    category: "Footwear",
    stock: 12,
  },
  {
    _id: "fallback-3",
    name: "Halo Smartwatch",
    price: 4999,
    originalPrice: 6999,
    discountPercent: 29,
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80",
    description: "Track workouts, sleep, and notifications with a bright AMOLED face.",
    category: "Electronics",
    stock: 9,
  },
  {
    _id: "fallback-4",
    name: "Echo Earbuds",
    price: 2199,
    originalPrice: 2999,
    discountPercent: 27,
    image:
      "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?auto=format&fit=crop&w=1200&q=80",
    description: "Noise-controlled earbuds with balanced sound and compact charging case.",
    category: "Audio",
    stock: 25,
  },
  {
    _id: "fallback-5",
    name: "Orbit Desk Lamp",
    price: 999,
    originalPrice: 1499,
    discountPercent: 33,
    image:
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1200&q=80",
    description: "Minimal task lamp with warm lighting modes for work and reading.",
    category: "Home",
    stock: 30,
  },
  {
    _id: "fallback-6",
    name: "Summit Backpack",
    price: 1899,
    originalPrice: 2499,
    discountPercent: 24,
    image:
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1200&q=80",
    description: "Weather-ready backpack with laptop sleeve, organizers, and bottle pockets.",
    category: "Travel",
    stock: 16,
  },
];

const readJson = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    console.error(error);
    return fallback;
  }
};

const writeJson = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const getStoredUser = () => readJson("user", null);

const scopedKey = (bucket, user) => {
  const identity = user?.email || "guest";
  return `shopx:${bucket}:${identity}`;
};

export const getWishlist = (user) => readJson(scopedKey("wishlist", user), []);

export const toggleWishlist = (user, productId) => {
  const wishlist = getWishlist(user);
  const next = wishlist.includes(productId)
    ? wishlist.filter((id) => id !== productId)
    : [productId, ...wishlist];
  writeJson(scopedKey("wishlist", user), next);
  return next;
};

export const getCart = (user) => readJson(scopedKey("cart", user), []);

const groupBuyKey = "shopx:groupBuys";
const GROUP_BUY_DURATION_MS = 60 * 60 * 1000;
const getGroupParticipantId = (user) =>
  String(user?.email || user?._id || user?.name || "guest").trim().toLowerCase();

const normalizeGroupBuyEntry = (entry) => {
  if (!entry) {
    return null;
  }

  if (typeof entry === "number") {
    return {
      count: entry,
      participants: [],
      expiresAt: Date.now() + GROUP_BUY_DURATION_MS,
    };
  }

  const participants = Array.isArray(entry.participants)
    ? [...new Set(entry.participants.map((participant) => String(participant).trim().toLowerCase()).filter(Boolean))]
    : [];
  const count = Math.max(Number(entry.count || 0), participants.length);

  return {
    count,
    participants,
    expiresAt: Number(entry.expiresAt || Date.now() + GROUP_BUY_DURATION_MS),
  };
};

export const addToCart = (user, product) => {
  const cart = getCart(user);
  const existing = cart.find((item) => item.productId === product._id);

  const next = existing
    ? cart.map((item) =>
        item.productId === product._id
          ? {
              ...item,
              quantity: item.quantity + 1,
              price: Number(product.price || item.price || 0),
              originalPrice: Number(
                product.originalPrice || item.originalPrice || getOriginalPrice(product)
              ),
              discountPercent: Number(
                product.discountPercent || item.discountPercent || getDiscountPercent(product)
              ),
              image: product.image || item.image,
              category: product.category || item.category,
            }
          : item
      )
    : [
        {
          productId: product._id,
          quantity: 1,
          name: product.name,
          price: Number(product.price || 0),
          originalPrice: Number(
            product.originalPrice || getOriginalPrice(product)
          ),
          discountPercent: Number(
            product.discountPercent || getDiscountPercent(product)
          ),
          image: product.image,
          category: product.category,
        },
        ...cart,
      ];

  writeJson(scopedKey("cart", user), next);
  return next;
};

export const updateCartQuantity = (user, productId, quantity) => {
  const cart = getCart(user);
  const next =
    quantity <= 0
      ? cart.filter((item) => item.productId !== productId)
      : cart.map((item) =>
          item.productId === productId ? { ...item, quantity } : item
        );
  writeJson(scopedKey("cart", user), next);
  return next;
};

export const removeFromCart = (user, productId) =>
  updateCartQuantity(user, productId, 0);

export const getPurchases = (user) => readJson(scopedKey("purchases", user), []);

export const checkoutCart = (user) => {
  const cart = getCart(user);
  if (!cart.length) {
    return { purchases: getPurchases(user), cart };
  }

  const purchases = getPurchases(user);
  const order = {
    id: `order-${Date.now()}`,
    purchasedAt: new Date().toISOString(),
    items: cart,
    total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
  };
  const nextPurchases = [order, ...purchases];

  writeJson(scopedKey("purchases", user), nextPurchases);
  writeJson(scopedKey("cart", user), []);

  return { purchases: nextPurchases, cart: [] };
};

export const getCheckoutDetails = (user) =>
  readJson(scopedKey("checkoutDetails", user), {
    fullName: user?.name || "",
    email: user?.email || "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    paymentMethod: "UPI",
  });

export const saveCheckoutDetails = (user, details) => {
  const merged = { ...getCheckoutDetails(user), ...details };
  writeJson(scopedKey("checkoutDetails", user), merged);
  return merged;
};

const REQUIRED_CHECKOUT_FIELDS = [
  "fullName",
  "phone",
  "email",
  "address",
  "city",
  "state",
  "pincode",
  "paymentMethod",
];

export const getMissingCheckoutFields = (details = {}) =>
  REQUIRED_CHECKOUT_FIELDS.filter((field) => !String(details[field] || "").trim());

export const placeOrder = (user, details, requestedCoins = 0) => {
  const cart = getCart(user);
  if (!cart.length) {
    return {
      purchases: getPurchases(user),
      cart,
      checkoutDetails: getCheckoutDetails(user),
      error: "Your cart is empty.",
    };
  }

  const checkoutDetails = saveCheckoutDetails(user, details);
  const missingFields = getMissingCheckoutFields(checkoutDetails);
  if (missingFields.length) {
    return {
      purchases: getPurchases(user),
      cart,
      checkoutDetails,
      coins: getCoins(user),
      error: `Please complete delivery details: ${missingFields.join(", ")}`,
    };
  }
  const purchases = getPurchases(user);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const availableCoins = getCoins(user);
  const { usableCoins, discountedTotal } = applyCoinsToTotal(
    requestedCoins || availableCoins,
    subtotal
  );
  const earnedCoins = Math.floor(discountedTotal * 0.05);
  const order = {
    id: `order-${Date.now()}`,
    purchasedAt: new Date().toISOString(),
    items: cart,
    subtotal,
    coinsUsed: usableCoins,
    coinsEarned: earnedCoins,
    total: discountedTotal,
    customer: checkoutDetails,
    status: "Confirmed",
  };
  const nextPurchases = [order, ...purchases];
  const remainingCoins = Math.max(availableCoins - usableCoins, 0) + earnedCoins;

  writeJson(scopedKey("purchases", user), nextPurchases);
  writeJson(scopedKey("cart", user), []);
  saveCoins(user, remainingCoins);

  return {
    purchases: nextPurchases,
    cart: [],
    checkoutDetails,
    coins: remainingCoins,
  };
};

export const getSearchHistory = (user) =>
  readJson(scopedKey("searchHistory", user), []);

export const pushSearchHistory = (user, term) => {
  const normalized = term.trim();
  if (!normalized) {
    return getSearchHistory(user);
  }

  const history = getSearchHistory(user);
  const next = [
    normalized,
    ...history.filter(
      (item) => item.toLowerCase() !== normalized.toLowerCase()
    ),
  ].slice(0, 5);

  writeJson(scopedKey("searchHistory", user), next);
  return next;
};

export const getGroupBuys = () => {
  const groups = readJson(groupBuyKey, {});
  const now = Date.now();
  const next = Object.entries(groups).reduce((acc, [productId, entry]) => {
    const normalized = normalizeGroupBuyEntry(entry);
    if (normalized && normalized.expiresAt > now) {
      acc[productId] = normalized;
    }
    return acc;
  }, {});

  writeJson(groupBuyKey, next);
  return next;
};

export const hasJoinedGroupBuy = (user, productId) => {
  const entry = normalizeGroupBuyEntry(getGroupBuys()[productId]);
  if (!entry) {
    return false;
  }

  return entry.participants.includes(getGroupParticipantId(user));
};

export const joinGroupBuy = (user, productId) => {
  const groups = getGroupBuys();
  const participantId = getGroupParticipantId(user);
  const current = normalizeGroupBuyEntry(groups[productId]) || {
    count: 0,
    participants: [],
    expiresAt: Date.now() + GROUP_BUY_DURATION_MS,
  };
  if (current.participants.includes(participantId)) {
    return { groups, joined: false };
  }

  const participants = [...current.participants, participantId];
  const next = {
    ...groups,
    [productId]: {
      count: participants.length,
      participants,
      expiresAt: current.expiresAt,
    },
  };
  writeJson(groupBuyKey, next);
  return { groups: next, joined: true };
};

export const getRecommendedProducts = (products, history) => {
  if (!history.length) {
    return products.slice(0, 4);
  }

  const terms = history
    .join(" ")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  return [...products]
    .map((product) => {
      const haystack = `${product.name} ${product.category} ${product.description}`.toLowerCase();
      const score = terms.reduce(
        (sum, term) => sum + (haystack.includes(term) ? 1 : 0),
        0
      );
      return { product, score };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .map((item) => item.product)
    .slice(0, 4);
};

export const getOriginalPrice = (product) =>
  Number(product.originalPrice || Math.round(Number(product.price || 0) * 1.25));

export const getDiscountPercent = (product) => {
  if (product.discountPercent) {
    return Number(product.discountPercent);
  }

  const originalPrice = getOriginalPrice(product);
  const price = Number(product.price || 0);
  if (!originalPrice || originalPrice <= price) {
    return 0;
  }

  return Math.round(((originalPrice - price) / originalPrice) * 100);
};

export const filterProducts = (products, query) => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return products;
  }

  return products.filter((product) =>
    `${product.name} ${product.category} ${product.description}`
      .toLowerCase()
      .includes(normalized)
  );
};

export const getWishlistProducts = (products, user) => {
  const wishlist = new Set(getWishlist(user));
  return products.filter((product) => wishlist.has(product._id));
};

export const getCartSummary = (user) => {
  const cart = getCart(user);
  return {
    items: cart,
    count: cart.reduce((sum, item) => sum + item.quantity, 0),
    total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
  };
};

export const syncCartPrices = (user, products) => {
  const cart = getCart(user);
  const groups = getGroupBuys();
  const productMap = new Map(products.map((product) => [product._id, product]));

  const next = cart.map((item) => {
    const product = productMap.get(item.productId);
    if (!product) {
      return item;
    }

    const groupState = getGroupBuyProgress(groups[item.productId] || 1);
    const baseDiscount = getDiscountPercent(product);
    const extraDiscount = getGroupBuyDiscountPercent(groups[item.productId] || 1);
    const price = groupState.unlocked
      ? getGroupBuyPrice(product, groups[item.productId] || 1)
      : Number(product.price || item.price || 0);

    return {
      ...item,
      name: product.name || item.name,
      image: product.image || item.image,
      category: product.category || item.category,
      originalPrice: getOriginalPrice(product),
      discountPercent: extraDiscount ? baseDiscount + extraDiscount : baseDiscount,
      price,
    };
  });

  writeJson(scopedKey("cart", user), next);
  return next;
};

export const getCoins = (user) => readJson(scopedKey("coins", user), 0);

export const saveCoins = (user, coins) => {
  writeJson(scopedKey("coins", user), coins);
  return coins;
};

export const applyCoinsToTotal = (coins, total) => {
  const usableCoins = Math.min(Number(coins || 0), Math.floor(Number(total || 0)));
  return {
    usableCoins,
    discountedTotal: Math.max(Number(total || 0) - usableCoins, 0),
  };
};

export const getGroupBuyProgress = (count, target = 5) => {
  const normalized = normalizeGroupBuyEntry(count) || { count: Number(count || 0) };
  const joined = Number(normalized.count || 0);
  return {
    joined,
    target,
    remaining: Math.max(target - joined, 0),
    progress: Math.min((joined / target) * 100, 100),
    unlocked: joined >= target,
    expiresAt: normalized.expiresAt || null,
  };
};

export const getGroupBuyDiscountPercent = (count, target = 5) =>
  getGroupBuyProgress(count, target).unlocked ? 15 : 0;

export const getGroupBuyPrice = (product, count, target = 5) => {
  const price = Number(product.price || 0);
  const discount = getGroupBuyDiscountPercent(count, target);
  if (!discount) {
    return price;
  }

  return Math.max(Math.round(price * (1 - discount / 100)), 0);
};
