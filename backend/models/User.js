const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      unique: true,
      required: true,
    },

    password: {
      type: String,
      required: true,
    },
    
    // 🔥 ADD THIS (MOST IMPORTANT)
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    resetToken: String,
    resetTokenExpire: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);