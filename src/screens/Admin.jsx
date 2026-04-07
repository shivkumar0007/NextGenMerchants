import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE, fallbackProducts, getStoredUser } from "../utils/shop";

const emptyForm = {
  name: "",
  price: "",
  image: "",
  description: "",
  category: "",
  stock: "",
};

const Admin = () => {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [products, setProducts] = useState(fallbackProducts);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem("token");

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/products`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.msg || "Failed to load products");
      }

      setProducts(Array.isArray(data) && data.length ? data : fallbackProducts);
    } catch (error) {
      console.error(error);
      setProducts(fallbackProducts);
      alert(error.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      const res = await fetch(
        editId ? `${API_BASE}/products/${editId}` : `${API_BASE}/products`,
        {
          method: editId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...form,
            price: Number(form.price),
            stock: Number(form.stock),
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.msg || "Unable to save product");
      }

      setForm(emptyForm);
      setEditId(null);
      await loadProducts();
    } catch (error) {
      console.error(error);
      alert(error.message || "Unable to save product");
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/products/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.msg || "Unable to delete product");
      }

      if (editId === id) {
        setEditId(null);
        setForm(emptyForm);
      }

      await loadProducts();
    } catch (error) {
      console.error(error);
      alert(error.message || "Unable to delete product");
    }
  };

  const editProduct = (product) => {
    setForm({
      name: product.name || "",
      price: product.price || "",
      image: product.image || "",
      description: product.description || "",
      category: product.category || "",
      stock: product.stock || "",
    });
    setEditId(product._id);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#04030d_0%,#09061b_100%)] px-4 py-5 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[30px] border border-white/10 bg-white/5 p-5 shadow-[0_24px_100px_rgba(5,8,20,0.45)] sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/75">
                Admin Workspace
              </p>
              <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
                Manage products with confidence
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">
                Responsive product management for {user?.name || "Admin"}.
                Create, edit, delete, and jump back to the customer dashboard or profile.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/dashboard")}
                className="rounded-full border border-white/15 px-5 py-2 text-sm font-medium hover:bg-white/10"
              >
                Dashboard
              </button>
              <button
                onClick={() => navigate("/profile")}
                className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-5 py-2 text-sm font-medium text-cyan-100 hover:bg-cyan-400/20"
              >
                Profile
              </button>
              <button
                onClick={logout}
                className="rounded-full border border-rose-400/30 px-5 py-2 text-sm font-medium text-rose-200 hover:bg-rose-500/10"
              >
                Logout
              </button>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-[30px] border border-white/10 bg-white/5 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-semibold">
                {editId ? "Edit Product" : "Add New Product"}
              </h2>
              {editId && (
                <button
                  onClick={() => {
                    setEditId(null);
                    setForm(emptyForm);
                  }}
                  className="rounded-full border border-white/15 px-4 py-2 text-sm"
                >
                  Reset
                </button>
              )}
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Product name"
                className="rounded-2xl border border-white/10 bg-[#090d1d] px-4 py-3 outline-none"
              />
              <input
                name="price"
                value={form.price}
                onChange={handleChange}
                placeholder="Price"
                className="rounded-2xl border border-white/10 bg-[#090d1d] px-4 py-3 outline-none"
              />
              <input
                name="image"
                value={form.image}
                onChange={handleChange}
                placeholder="Image URL"
                className="rounded-2xl border border-white/10 bg-[#090d1d] px-4 py-3 outline-none md:col-span-2"
              />
              <input
                name="category"
                value={form.category}
                onChange={handleChange}
                placeholder="Category"
                className="rounded-2xl border border-white/10 bg-[#090d1d] px-4 py-3 outline-none"
              />
              <input
                name="stock"
                value={form.stock}
                onChange={handleChange}
                placeholder="Stock"
                className="rounded-2xl border border-white/10 bg-[#090d1d] px-4 py-3 outline-none"
              />
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Description"
                rows="5"
                className="rounded-2xl border border-white/10 bg-[#090d1d] px-4 py-3 outline-none md:col-span-2"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={saving}
              className="mt-5 w-full rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : editId
                ? "Update Product"
                : "Create Product"}
            </button>
          </section>

          <section className="rounded-[30px] border border-white/10 bg-white/5 p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Live Catalog</h2>
                <p className="text-sm text-slate-400">
                  {loading ? "Refreshing products..." : `${products.length} products available`}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {products.map((product) => (
                <article
                  key={product._id}
                  className="overflow-hidden rounded-[26px] border border-white/10 bg-[#0d1024]"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-44 w-full object-cover"
                  />
                  <div className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold">{product.name}</h3>
                        <p className="text-sm text-slate-400">{product.category}</p>
                      </div>
                      <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100">
                        Stock {product.stock}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300">
                      {product.description}
                    </p>
                    <p className="text-lg font-semibold">Rs. {product.price}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => editProduct(product)}
                        className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-950"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteProduct(product._id)}
                        className="rounded-2xl border border-rose-400/30 px-4 py-2 text-sm font-semibold text-rose-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Admin;
