const express = require("express");
const router = express.Router();

const Product = require("../models/Product");

// ➕ Add product
router.post("/", async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.json(product);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// 📦 Get all products
router.get("/", async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

module.exports = router;