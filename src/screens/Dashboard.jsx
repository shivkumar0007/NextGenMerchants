import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const products = [
    { id: 1, name: "T-Shirt", price: 499, img: "https://via.placeholder.com/200" },
    { id: 2, name: "Shoes", price: 1999, img: "https://via.placeholder.com/200" },
    { id: 3, name: "Watch", price: 2999, img: "https://via.placeholder.com/200" },
  ];

  const features = [
    "🎁 AI Gift Recommendation",
    "🤖 AI Shopping Assistant",
    "🎤 Voice Search",
    "👓 AR Try Before Buy",
    "📊 Personalized Feed",
    "🎮 Gamification",
    "🎥 Short Video Shopping",
    "👥 Group Buying",
  ];

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#050014] text-white p-6">

      {/* 🔥 HEADER */}
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-bold">SHOPX AI 🚀</h1>

        {/* 👤 USER ICON */}
        <div className="relative">
          <div
            onClick={() => setOpen(!open)}
            className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center cursor-pointer font-bold"
          >
            U
          </div>

          {/* DROPDOWN */}
          {open && (
            <div className="absolute right-0 mt-3 w-48 bg-black border border-white/10 rounded-lg shadow-lg">

              <button onClick={() => navigate("/dashboard")} className="w-full p-2 hover:bg-white/10 text-left">
                🏠 Dashboard
              </button>

              <button onClick={() => navigate("/login")} className="w-full p-2 hover:bg-white/10 text-left">
                🔐 Login
              </button>

              <button onClick={logout} className="w-full p-2 text-red-400 hover:bg-white/10 text-left">
                🚪 Logout
              </button>

            </div>
          )}
        </div>
      </div>

      {/* 🔥 FEATURES */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
        {features.map((item, index) => (
          <div
            key={index}
            className="bg-white/5 border border-white/10 p-5 rounded-xl hover:scale-105 transition cursor-pointer"
          >
            <h3 className="font-semibold text-sm">{item}</h3>
          </div>
        ))}
      </div>

      {/* 🔥 PRODUCTS */}
      <h2 className="text-2xl font-bold mb-6">🛍️ Products</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">

        {products.map((product) => (
          <div
            key={product.id}
            className="bg-white/5 border border-white/10 rounded-xl p-4 hover:scale-105 transition"
          >
            <img
              src={product.img}
              alt={product.name}
              className="w-full h-40 object-cover rounded-lg mb-3"
            />

            <h3 className="text-lg font-bold">{product.name}</h3>
            <p className="text-gray-400 mb-3">₹{product.price}</p>

            {/* ACTION BUTTONS */}
            <div className="flex justify-between items-center text-xl">

              <button
                title="Add to Wishlist"
                className="hover:scale-125 transition"
              >
                ❤️
              </button>

              <button
                title="Add to Cart"
                className="hover:scale-125 transition"
              >
                🛒
              </button>

              <button
                title="Try in AR"
                className="hover:scale-125 transition"
              >
                👓
              </button>

            </div>
          </div>
        ))}

      </div>
    </div>
  );
};

export default Dashboard;