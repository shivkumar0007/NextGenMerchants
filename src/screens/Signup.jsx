import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Signup = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const res = await fetch("https://nextgen-backend-y4fj.onrender.com/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.msg || "Signup failed ❌");
        setLoading(false);
        return;
      }

      alert("Signup Success ✅");

      // 🔥 auto redirect to login
      navigate("/login");

    } catch (err) {
      alert("Server error ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050014] text-white">

      <div className="w-[800px] h-[450px] flex rounded-xl overflow-hidden border border-purple-500/30 shadow-[0_0_40px_rgba(168,85,247,0.4)]">

        {/* LEFT */}
        <div className="w-1/2 bg-gradient-to-br from-purple-600 to-indigo-700 flex flex-col justify-center items-center text-center p-10">
          <h1 className="text-3xl font-bold mb-4">JOIN US 🚀</h1>
          <p className="text-sm text-gray-200">
            Create account and unlock smart shopping experience
          </p>
        </div>

        {/* RIGHT FORM */}
        <div className="w-1/2 bg-black p-10 flex flex-col justify-center">
          <h2 className="text-3xl font-bold mb-8">Signup</h2>

          <form onSubmit={handleSubmit} className="space-y-6">

            <input
              placeholder="Name"
              required
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
              className="w-full bg-transparent border-b border-gray-500 focus:border-purple-500 outline-none p-2"
            />

            <input
              type="email"
              placeholder="Email"
              required
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
              className="w-full bg-transparent border-b border-gray-500 focus:border-purple-500 outline-none p-2"
            />

            <input
              type="password"
              placeholder="Password"
              required
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
              className="w-full bg-transparent border-b border-gray-500 focus:border-purple-500 outline-none p-2"
            />

            <button
              disabled={loading}
              className="w-full py-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 hover:scale-105 transition-all font-bold"
            >
              {loading ? "Creating..." : "Signup"}
            </button>

            <p className="text-sm text-gray-400">
              Already have an account?{" "}
              <Link to="/login" className="text-purple-400 hover:underline">
                Login
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;