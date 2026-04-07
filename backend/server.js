const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

// DB connect
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch((err) => console.log(err));

// test route
app.get("/", (req, res) => {
  res.send("API Running 🚀");
});

// routes
app.use("/api/auth", require("./routes/auth"));

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const productRoutes = require("./routes/product");

app.use("/api/products", productRoutes);