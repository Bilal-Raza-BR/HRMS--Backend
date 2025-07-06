const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
  },
  companyEmail: {
    type: String,
    required: true,
    unique: true, // Taake ek email se ek hi request ho
  },
  industry: {
    type: String,
  },
  contactPerson: {
    type: String,
  },
  phone: {
    type: String,
  },
  message: {
    type: String,
  },
  isHandled: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const request = mongoose.model("Request", requestSchema);
module.exports = request
