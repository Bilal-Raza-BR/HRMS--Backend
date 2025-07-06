const mongoose = require("mongoose");
const slugify = require("slugify");

// Embedded Schemas
const userSchema = require("../schemas/userSchema");
const applicationSchema = require("../schemas/applicationSchema");

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true, // auto-generated from name
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  logoUrl: {
    type: String, // Cloudinary image
  },
  industry: {
    type: String,
  },
  website: {
    type: String,
  },
  phone: {
    type: String,
  },
  address: {
    type: String,
  },
  isApproved: {
    type: Boolean,
    default: false,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Owner",
  },
  users: [userSchema],
  applications: [applicationSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  isActive: {
    type: Boolean,
    default: true,
  }
});

// 🔥 Auto-generate slug from company name before saving
companySchema.pre("save", function (next) {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    });
  }
  next();
});

module.exports = mongoose.model("Company", companySchema);
