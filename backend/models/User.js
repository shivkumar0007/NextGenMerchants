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
    resetToken: String,
    resetTokenExpire: Date,
  },
  { timestamps: true } // 🔥 createdAt & updatedAt auto add
);

module.exports = mongoose.model("User", userSchema);