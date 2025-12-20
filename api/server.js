const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const connectDB = require("../config/db");

dotenv.config();

const app = express();

// DB connect
connectDB();

// CORS Configuration
app.use(
  cors({
    origin: [
      "https://hrms-frontend-rosy-omega.vercel.app",
      "https://hrms-frontend-ct7tngh1p-bilal-raza-brs-projects.vercel.app",
    ], // Aapke frontend URLs
    credentials: true, // Cookies allow karne ke liye
  })
);

// Body & cookies
app.use(express.json());
app.use(cookieParser());

// Test route
app.get("/", (req, res) => {
  res.send("Backend running on Vercel 🚀");
});

// API routes
app.use("/api", require("../routes/routes"));

module.exports = app;
