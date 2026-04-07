const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: String,
    price: Number,
    originalPrice: Number,
    discountPercent: Number,
    image: String,
    images: [String],
    colors: [String],
    description: String,
    category: String,
    stock: Number,
    tryOnEnabled: {
      type: Boolean,
      default: false,
    },
    tryOnType: {
      type: String,
      default: "",
    },
    tryOnAsset: {
      type: String,
      default: "",
    },
    tryOnOverlayImage: {
      type: String,
      default: "",
    },
    tryOnWidthScale: {
      type: Number,
      default: 1,
    },
    tryOnHeightRatio: {
      type: Number,
      default: 0.42,
    },
    tryOnYOffset: {
      type: Number,
      default: -0.12,
    },
    tryOnModelScaleMultiplier: {
      type: Number,
      default: 1.45,
    },
    tryOnModelOffsetY: {
      type: Number,
      default: 0,
    },
    tryOnModelOffsetZ: {
      type: Number,
      default: 0,
    },
    tryOnModelRotationX: {
      type: Number,
      default: 0,
    },
    tryOnModelRotationY: {
      type: Number,
      default: 90,
    },
    tryOnModelRotationZ: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
