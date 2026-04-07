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

export const addToCart = (user, product) => {
  const cart = getCart(user);
  const existing = cart.find((item) => item.productId === product._id);

  const next = existing
    ? cart.map((item) =>
        item.productId === product._id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    : [
        {
          productId: product._id,
          quantity: 1,
          name: product.name,
          price: Number(product.price || 0),
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

export const getGroupBuys = () => readJson("shopx:groupBuys", {});

export const joinGroupBuy = (productId) => {
  const groups = getGroupBuys();
  const current = groups[productId] || 1;
  const next = { ...groups, [productId]: current + 1 };
  writeJson("shopx:groupBuys", next);
  return next;
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
