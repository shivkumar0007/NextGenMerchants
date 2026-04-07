const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  originalPrice: Number,
  discountPercent: Number,
  image: String,
  description: String,
  category: String,
  stock: Number,
}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);
