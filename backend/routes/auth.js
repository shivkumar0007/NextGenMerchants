const express = require("express");
const router = express.Router();

const {
  signup,
  login,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");

// test route
router.get("/", (req, res) => {
  res.send("Auth Routes Working ✅");
});

router.post("/signup", signup);
router.post("/login", login);
router.post("/forgot", forgotPassword);
router.post("/reset/:token", resetPassword);

module.exports = router;