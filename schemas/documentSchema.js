const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
  type: {
    type: String, // e.g. 'CNIC', 'Resume', 'Contract'
    required: true,
  },
  url: {
    type: String, // Cloudinary URL
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = documentSchema;
