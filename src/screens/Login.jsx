import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? "http://localhost:5000/api"
    : "https://nextgen-backend-y4fj.onrender.com/api");

const Login = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.msg || "Login failed");
        return;
      }

      if (!data.token) {
        alert("Login failed: token not received");
        return;
      }

      const user = data.user || {
        _id: data._id || data.id || "",
        name: data.name || form.email.split("@")[0],
        email: data.email || form.email,
        role: data.role || "user",
      };

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(user));

      alert("Login Success");
      navigate(user.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      console.error(err);
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050014] text-white">
      <div className="w-[800px] h-[450px] flex rounded-xl overflow-hidden border border-purple-500/30 shadow-[0_0_40px_rgba(168,85,247,0.4)]">
        <div className="w-1/2 bg-black p-10 flex flex-col justify-center">
          <h2 className="text-3xl font-bold mb-8">Login</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <input
              type="email"
              placeholder="Email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full bg-transparent border-b border-gray-500 focus:border-purple-500 outline-none p-2"
            />

            <input
              type="password"
              placeholder="Password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full bg-transparent border-b border-gray-500 focus:border-purple-500 outline-none p-2"
            />

            <button
              disabled={loading}
              className="w-full py-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 hover:scale-105 transition-all font-bold disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            <p className="text-sm text-gray-400">
              Don&apos;t have an account?{" "}
              <Link to="/signup" className="text-purple-400 hover:underline">
                Sign Up
              </Link>
            </p>
          </form>
        </div>

        <div className="w-1/2 bg-gradient-to-br from-purple-600 to-indigo-700 flex flex-col justify-center items-center text-center p-10">
          <h1 className="text-3xl font-bold mb-4">WELCOME BACK!</h1>
          <p className="text-sm text-gray-200">
            Login to explore AI powered shopping experience
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
