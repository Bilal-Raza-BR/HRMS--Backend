const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
  },
  position: {
    type: String,
    required: true,
  },
  resume: {
    type: String, // Cloudinary URL
    required: true,
  },
  message: {
    type: String,
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },
  appliedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = applicationSchema;
