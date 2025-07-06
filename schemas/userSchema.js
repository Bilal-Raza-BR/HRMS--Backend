const mongoose = require("mongoose");

// Import sub-schemas
const documentSchema = require("./documentSchema");
const attendanceSchema = require("./attendanceSchema");
const leaveSchema = require("./leaveSchema");
const notificationSchema = require("./notificationSchema");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["admin", "hr", "employee"],
    required: true,
  },
  phone: {
    type: String,
  },
  gender: {
    type: String,
  },
  dob: {
    type: Date,
  },
  profilePic: {
    type: String, // Cloudinary URL
  },
  salary: {
    type: Number,
  },
  address: {
    type: String,
  },
  status: {
    type: String,
    enum: ["active", "terminated"],
    default: "active",
  },
  joiningDate: {
    type: Date,
  },
  leavesTaken: {
    type: Number,
    default: 0,
  },
  documents: [documentSchema],
  attendance: [attendanceSchema],
  leaves: [leaveSchema],
  notifications: [notificationSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = userSchema;
