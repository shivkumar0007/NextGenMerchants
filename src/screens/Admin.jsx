import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  API_BASE,
  fallbackProducts,
  getPrimaryImage,
  getProductColors,
  getProductImages,
  getStoredUser,
} from "../utils/shop";
import {
  uploadFileToCloudinary,
  uploadMultipleFilesToCloudinary,
} from "../lib/cloudinary";

const emptyForm = {
  name: "",
  price: "",
  originalPrice: "",
  discountPercent: "",
  image: "",
  imagesInput: "",
  colorsInput: "",
  description: "",
  category: "",
  stock: "",
  tryOnEnabled: false,
  tryOnType: "",
  tryOnAsset: "",
  tryOnOverlayImage: "",
  tryOnWidthScale: "1",
  tryOnHeightRatio: "0.42",
  tryOnYOffset: "-0.12",
  tryOnModelScaleMultiplier: "1.45",
  tryOnModelOffsetY: "0",
  tryOnModelOffsetZ: "0",
  tryOnModelRotationX: "0",
  tryOnModelRotationY: "90",
  tryOnModelRotationZ: "0",
};

const splitLines = (value) =>
  value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

const Admin = () => {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [products, setProducts] = useState(fallbackProducts);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPrimary, setUploadingPrimary] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadingModel, setUploadingModel] = useState(false);
  const [uploadingOverlay, setUploadingOverlay] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadProgress, setUploadProgress] = useState({
    primary: 0,
    gallery: 0,
    model: 0,
    overlay: 0,
  });

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
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async () => {
    try {
      if (uploadingPrimary || uploadingGallery || uploadingModel || uploadingOverlay) {
        alert("Please wait for Cloudinary uploads to finish before saving the product.");
        return;
      }

      setSaving(true);

      const images = splitLines(form.imagesInput);
      const colors = splitLines(form.colorsInput);
      const primaryImage = form.image.trim() || images[0] || "";

      const payload = {
        name: form.name,
        price: Number(form.price),
        originalPrice: Number(form.originalPrice),
        discountPercent: Number(form.discountPercent),
        image: primaryImage,
        images: images.length ? images : primaryImage ? [primaryImage] : [],
        colors,
        description: form.description,
        category: form.category,
        stock: Number(form.stock),
        tryOnEnabled: Boolean(form.tryOnEnabled),
        tryOnType: form.tryOnEnabled ? form.tryOnType : "",
        tryOnAsset: form.tryOnEnabled ? form.tryOnAsset.trim() : "",
        tryOnOverlayImage: form.tryOnEnabled ? form.tryOnOverlayImage.trim() : "",
        tryOnWidthScale: form.tryOnEnabled ? Number(form.tryOnWidthScale || 1) : 1,
        tryOnHeightRatio: form.tryOnEnabled ? Number(form.tryOnHeightRatio || 0.42) : 0.42,
        tryOnYOffset: form.tryOnEnabled ? Number(form.tryOnYOffset || -0.12) : -0.12,
        tryOnModelScaleMultiplier: form.tryOnEnabled
          ? Number(form.tryOnModelScaleMultiplier || 1.45)
          : 1.45,
        tryOnModelOffsetY: form.tryOnEnabled ? Number(form.tryOnModelOffsetY || 0) : 0,
        tryOnModelOffsetZ: form.tryOnEnabled ? Number(form.tryOnModelOffsetZ || 0) : 0,
        tryOnModelRotationX: form.tryOnEnabled ? Number(form.tryOnModelRotationX || 0) : 0,
        tryOnModelRotationY: form.tryOnEnabled ? Number(form.tryOnModelRotationY || 90) : 90,
        tryOnModelRotationZ: form.tryOnEnabled ? Number(form.tryOnModelRotationZ || 0) : 0,
      };

      const res = await fetch(
        editId ? `${API_BASE}/products/${editId}` : `${API_BASE}/products`,
        {
          method: editId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.msg || "Unable to save product");
      }

      setForm(emptyForm);
      setEditId(null);
      setUploadMessage("");
      await loadProducts();
    } catch (error) {
      console.error(error);
      alert(error.message || "Unable to save product");
    } finally {
      setSaving(false);
    }
  };

  const handlePrimaryImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setUploadingPrimary(true);
      setUploadMessage("Uploading primary image to Cloudinary...");
      setUploadProgress((current) => ({ ...current, primary: 0 }));
      const url = await uploadFileToCloudinary(file, "products/primary", (progress) => {
        setUploadProgress((current) => ({ ...current, primary: progress }));
      });
      setForm((current) => {
        const images = splitLines(current.imagesInput);
        const nextImages = images.length ? images : [url];
        return {
          ...current,
          image: url,
          imagesInput: nextImages.join("\n"),
        };
      });
      setUploadMessage("Primary image uploaded to Cloudinary and URL added automatically.");
    } catch (error) {
      console.error(error);
      const message =
        error?.message || "Primary image upload failed.";
      setUploadMessage(message);
      alert(message);
    } finally {
      setUploadingPrimary(false);
      event.target.value = "";
    }
  };

  const handleGalleryUpload = async (event) => {
    const files = event.target.files;
    if (!files?.length) {
      return;
    }

    try {
      setUploadingGallery(true);
      setUploadMessage("Uploading gallery images to Cloudinary...");
      setUploadProgress((current) => ({ ...current, gallery: 0 }));
      const urls = await uploadMultipleFilesToCloudinary(
        files,
        "products/gallery",
        (progress) => {
          setUploadProgress((current) => ({ ...current, gallery: progress }));
        }
      );
      setForm((current) => {
        const merged = [...splitLines(current.imagesInput), ...urls];
        const unique = [...new Set(merged)];
        return {
          ...current,
          image: current.image || unique[0] || "",
          imagesInput: unique.join("\n"),
        };
      });
      setUploadMessage("Gallery images uploaded to Cloudinary and URLs added automatically.");
    } catch (error) {
      console.error(error);
      const message =
        error?.message || "Gallery upload failed.";
      setUploadMessage(message);
      alert(message);
    } finally {
      setUploadingGallery(false);
      event.target.value = "";
    }
  };

  const handleTryOnModelUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setUploadingModel(true);
      setUploadMessage("Uploading 3D model to Cloudinary...");
      setUploadProgress((current) => ({ ...current, model: 0 }));
      const url = await uploadFileToCloudinary(file, "products/models", (progress) => {
        setUploadProgress((current) => ({ ...current, model: progress }));
      });
      setForm((current) => ({
        ...current,
        tryOnAsset: url,
        tryOnEnabled: true,
      }));
      setUploadMessage("3D model uploaded to Cloudinary and URL added automatically.");
    } catch (error) {
      console.error(error);
      const message =
        error?.message || "3D model upload failed.";
      setUploadMessage(message);
      alert(message);
    } finally {
      setUploadingModel(false);
      event.target.value = "";
    }
  };

  const handleTryOnOverlayUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setUploadingOverlay(true);
      setUploadMessage("Uploading try-on overlay image to Cloudinary...");
      setUploadProgress((current) => ({ ...current, overlay: 0 }));
      const url = await uploadFileToCloudinary(file, "products/overlay", (progress) => {
        setUploadProgress((current) => ({ ...current, overlay: progress }));
      });
      setForm((current) => ({
        ...current,
        tryOnOverlayImage: url,
        tryOnEnabled: true,
      }));
      setUploadMessage("Try-on overlay image uploaded and URL added automatically.");
    } catch (error) {
      console.error(error);
      const message = error?.message || "Try-on overlay upload failed.";
      setUploadMessage(message);
      alert(message);
    } finally {
      setUploadingOverlay(false);
      event.target.value = "";
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
    const images = getProductImages(product);
    const colors = getProductColors(product);

    setForm({
      name: product.name || "",
      price: product.price || "",
      originalPrice: product.originalPrice || "",
      discountPercent: product.discountPercent || "",
      image: getPrimaryImage(product) || "",
      imagesInput: images.join("\n"),
      colorsInput: colors.join(", "),
      description: product.description || "",
      category: product.category || "",
      stock: product.stock || "",
      tryOnEnabled: Boolean(product.tryOnEnabled),
      tryOnType: product.tryOnType || "",
      tryOnAsset: product.tryOnAsset || "",
      tryOnOverlayImage: product.tryOnOverlayImage || "",
      tryOnWidthScale: String(product.tryOnWidthScale ?? 1),
      tryOnHeightRatio: String(product.tryOnHeightRatio ?? 0.42),
      tryOnYOffset: String(product.tryOnYOffset ?? -0.12),
      tryOnModelScaleMultiplier: String(product.tryOnModelScaleMultiplier ?? 1.45),
      tryOnModelOffsetY: String(product.tryOnModelOffsetY ?? 0),
      tryOnModelOffsetZ: String(product.tryOnModelOffsetZ ?? 0),
      tryOnModelRotationX: String(product.tryOnModelRotationX ?? 0),
      tryOnModelRotationY: String(product.tryOnModelRotationY ?? 90),
      tryOnModelRotationZ: String(product.tryOnModelRotationZ ?? 0),
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
                Responsive product management for {user?.name || "Admin"}. Create,
                edit, delete, set multiple colors and gallery images, and keep
                products ready for future 3D try-on.
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

        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
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
                name="category"
                value={form.category}
                onChange={handleChange}
                placeholder="Category"
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
                name="originalPrice"
                value={form.originalPrice}
                onChange={handleChange}
                placeholder="Original Price"
                className="rounded-2xl border border-white/10 bg-[#090d1d] px-4 py-3 outline-none"
              />
              <input
                name="discountPercent"
                value={form.discountPercent}
                onChange={handleChange}
                placeholder="Discount %"
                className="rounded-2xl border border-white/10 bg-[#090d1d] px-4 py-3 outline-none"
              />
              <input
                name="stock"
                value={form.stock}
                onChange={handleChange}
                placeholder="Stock"
                className="rounded-2xl border border-white/10 bg-[#090d1d] px-4 py-3 outline-none"
              />
              <input
                name="image"
                value={form.image}
                onChange={handleChange}
                placeholder="Primary image URL"
                className="rounded-2xl border border-white/10 bg-[#090d1d] px-4 py-3 outline-none md:col-span-2"
              />
              <label className="rounded-2xl border border-dashed border-cyan-400/30 bg-cyan-400/5 px-4 py-3 text-sm text-cyan-100 md:col-span-2">
                <span className="block font-medium">
                  {uploadingPrimary ? "Uploading primary image..." : "Upload Primary Image"}
                </span>
                <span className="mt-1 block text-xs text-slate-300">
                  Select one file and Cloudinary URL will be added automatically.
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePrimaryImageUpload}
                  disabled={uploadingPrimary}
                  className="mt-3 block w-full text-xs text-slate-300"
                />
              </label>
              <textarea
                name="imagesInput"
                value={form.imagesInput}
                onChange={handleChange}
                placeholder="Multiple image URLs, one per line"
                rows="4"
                className="rounded-2xl border border-white/10 bg-[#090d1d] px-4 py-3 outline-none"
              />
              <label className="rounded-2xl border border-dashed border-cyan-400/30 bg-cyan-400/5 px-4 py-3 text-sm text-cyan-100">
                <span className="block font-medium">
                  {uploadingGallery ? "Uploading gallery images..." : "Upload Gallery Images"}
                </span>
                <span className="mt-1 block text-xs text-slate-300">
                  Select multiple images. URLs will be appended automatically.
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleGalleryUpload}
                  disabled={uploadingGallery}
                  className="mt-3 block w-full text-xs text-slate-300"
                />
              </label>
              <textarea
                name="colorsInput"
                value={form.colorsInput}
                onChange={handleChange}
                placeholder="Colors, separated by comma. Example: Black, Gold, Blue"
                rows="4"
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

            {uploadMessage && (
              <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-50">
                {uploadMessage}
                {(uploadingPrimary || uploadingGallery || uploadingModel || uploadingOverlay) && (
                  <div className="mt-2 space-y-2 text-xs text-cyan-100">
                    {uploadingPrimary && (
                      <p>Primary image upload: {uploadProgress.primary}%</p>
                    )}
                    {uploadingGallery && (
                      <p>Gallery upload: {uploadProgress.gallery}%</p>
                    )}
                    {uploadingModel && <p>3D model upload: {uploadProgress.model}%</p>}
                    {uploadingOverlay && (
                      <p>Overlay image upload: {uploadProgress.overlay}%</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {form.image && (
              <div className="mt-4 rounded-[24px] border border-white/10 bg-[#0d1024] p-4">
                <p className="text-sm font-medium text-slate-200">Primary Image Preview</p>
                <img
                  src={form.image}
                  alt="Primary preview"
                  className="mt-3 h-40 w-full rounded-2xl object-cover"
                />
                <p className="mt-2 break-all text-xs text-slate-400">{form.image}</p>
              </div>
            )}

            {splitLines(form.imagesInput).length > 0 && (
              <div className="mt-4 rounded-[24px] border border-white/10 bg-[#0d1024] p-4">
                <p className="text-sm font-medium text-slate-200">
                  Gallery URLs Added: {splitLines(form.imagesInput).length}
                </p>
                <div className="mt-3 grid grid-cols-3 gap-3">
                  {splitLines(form.imagesInput)
                    .slice(0, 6)
                    .map((image) => (
                      <img
                        key={image}
                        src={image}
                        alt="Gallery preview"
                        className="h-20 w-full rounded-2xl object-cover"
                      />
                    ))}
                </div>
              </div>
            )}

            <div className="mt-5 rounded-[24px] border border-cyan-400/20 bg-cyan-400/10 p-4">
              <label className="flex items-center gap-3 text-sm font-medium text-cyan-50">
                <input
                  type="checkbox"
                  name="tryOnEnabled"
                  checked={form.tryOnEnabled}
                  onChange={handleChange}
                  className="h-4 w-4"
                />
                Enable virtual try-on for this product
              </label>

              {form.tryOnEnabled && (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <select
                    name="tryOnType"
                    value={form.tryOnType}
                    onChange={handleChange}
                    className="rounded-2xl border border-white/10 bg-[#090d1d] px-4 py-3 outline-none"
                  >
                    <option value="">Select try-on type</option>
                    <option value="glasses">Glasses</option>
                    <option value="earring">Earring</option>
                    <option value="jhumka">Jhumka</option>
                  </select>
                  <input
                    name="tryOnAsset"
                    value={form.tryOnAsset}
                    onChange={handleChange}
                    placeholder="3D/overlay asset URL"
                    className="rounded-2xl border border-white/10 bg-[#090d1d] px-4 py-3 outline-none"
                  />
                  <input
                    name="tryOnOverlayImage"
                    value={form.tryOnOverlayImage}
                    onChange={handleChange}
                    placeholder="Transparent overlay PNG URL"
                    className="rounded-2xl border border-white/10 bg-[#090d1d] px-4 py-3 outline-none"
                  />
                  <label className="rounded-2xl border border-dashed border-amber-400/30 bg-amber-400/5 px-4 py-3 text-sm text-amber-100">
                    <span className="block font-medium">
                      {uploadingOverlay ? "Uploading overlay image..." : "Upload Overlay PNG"}
                    </span>
                    <span className="mt-1 block text-xs text-slate-300">
                      Use transparent sunglass PNG for real face try-on.
                    </span>
                    <input
                      type="file"
                      accept="image/png,image/webp"
                      onChange={handleTryOnOverlayUpload}
                      disabled={uploadingOverlay}
                      className="mt-3 block w-full text-xs text-slate-300"
                    />
                  </label>
                  <label className="rounded-2xl border border-dashed border-emerald-400/30 bg-emerald-400/5 px-4 py-3 text-sm text-emerald-100 md:col-span-2">
                    <span className="block font-medium">
                      {uploadingModel ? "Uploading 3D model..." : "Upload 3D Model"}
                    </span>
                    <span className="mt-1 block text-xs text-slate-300">
                      Upload `.glb` or `.gltf` and Cloudinary URL will be added automatically.
                    </span>
                    <input
                      type="file"
                      accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
                      onChange={handleTryOnModelUpload}
                      disabled={uploadingModel}
                      className="mt-3 block w-full text-xs text-slate-300"
                    />
                  </label>
                  <input
                    name="tryOnWidthScale"
                    value={form.tryOnWidthScale}
                    onChange={handleChange}
                    placeholder="Width scale e.g. 1.35"
                    className="rounded-2xl border border-white/10 bg-[#090d1d] px-4 py-3 outline-none"
                  />
                  <input
                    name="tryOnHeightRatio"
                    value={form.tryOnHeightRatio}
                    onChange={handleChange}
                    placeholder="Height ratio e.g. 0.42"
                    className="rounded-2xl border border-white/10 bg-[#090d1d] px-4 py-3 outline-none"
                  />
                  <input
                    name="tryOnYOffset"
                    value={form.tryOnYOffset}
                    onChange={handleChange}
                    placeholder="Y offset e.g. -0.12"
                    className="rounded-2xl border border-white/10 bg-[#090d1d] px-4 py-3 outline-none"
                  />
                  <input
                    name="tryOnModelScaleMultiplier"
                    value={form.tryOnModelScaleMultiplier}
                    onChange={handleChange}
                    placeholder="3D scale multiplier e.g. 1.45"
                    className="rounded-2xl border border-white/10 bg-[#090d1d] px-4 py-3 outline-none"
                  />
                  <input
                    name="tryOnModelOffsetY"
                    value={form.tryOnModelOffsetY}
                    onChange={handleChange}
                    placeholder="3D model offset Y e.g. 0"
                    className="rounded-2xl border border-white/10 bg-[#090d1d] px-4 py-3 outline-none"
                  />
                  <input
                    name="tryOnModelOffsetZ"
                    value={form.tryOnModelOffsetZ}
                    onChange={handleChange}
                    placeholder="3D model offset Z e.g. 0"
                    className="rounded-2xl border border-white/10 bg-[#090d1d] px-4 py-3 outline-none"
                  />
                  <input
                    name="tryOnModelRotationX"
                    value={form.tryOnModelRotationX}
                    onChange={handleChange}
                    placeholder="Rotation X degree e.g. 0"
                    className="rounded-2xl border border-white/10 bg-[#090d1d] px-4 py-3 outline-none"
                  />
                  <input
                    name="tryOnModelRotationY"
                    value={form.tryOnModelRotationY}
                    onChange={handleChange}
                    placeholder="Rotation Y degree e.g. 90"
                    className="rounded-2xl border border-white/10 bg-[#090d1d] px-4 py-3 outline-none"
                  />
                  <input
                    name="tryOnModelRotationZ"
                    value={form.tryOnModelRotationZ}
                    onChange={handleChange}
                    placeholder="Rotation Z degree e.g. 0"
                    className="rounded-2xl border border-white/10 bg-[#090d1d] px-4 py-3 outline-none md:col-span-2"
                  />
                </div>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={
                saving ||
                uploadingPrimary ||
                uploadingGallery ||
                uploadingModel ||
                uploadingOverlay
              }
              className="mt-5 w-full rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : uploadingPrimary || uploadingGallery || uploadingModel || uploadingOverlay
                ? "Please wait for uploads..."
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
                  {loading
                    ? "Refreshing products..."
                    : `${products.length} products available`}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {products.map((product) => {
                const images = getProductImages(product);
                const colors = getProductColors(product);

                return (
                  <article
                    key={product._id}
                    className="overflow-hidden rounded-[26px] border border-white/10 bg-[#0d1024]"
                  >
                    <img
                      src={getPrimaryImage(product)}
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
                      <p className="text-sm text-slate-300">{product.description}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-semibold">Rs. {product.price}</p>
                        {product.originalPrice ? (
                          <span className="text-sm text-slate-500 line-through">
                            Rs. {product.originalPrice}
                          </span>
                        ) : null}
                        {product.discountPercent ? (
                          <span className="rounded-full bg-emerald-400/15 px-2 py-1 text-xs text-emerald-200">
                            {product.discountPercent}% OFF
                          </span>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {colors.map((color) => (
                          <span
                            key={color}
                            className="rounded-full border border-white/10 px-2 py-1 text-xs text-slate-200"
                          >
                            {color}
                          </span>
                        ))}
                        {!colors.length && (
                          <span className="text-xs text-slate-500">No color variants</span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400">
                        {images.length} image{images.length === 1 ? "" : "s"}
                        {product.tryOnEnabled
                          ? ` • Try-on ready (${product.tryOnType || "custom"})`
                          : ""}
                      </p>

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
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Admin;
