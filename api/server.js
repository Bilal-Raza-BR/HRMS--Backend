const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");

const connectDB = require("../config/db");

dotenv.config();

const app = express();

// DB connect
connectDB();

const allowedOrigins = [
  process.env.FRONTEND_URL, // Local dev URL from .env
  "https://hrms-frontend-rosy-omega.vercel.app", // Production domain
  /^https:\/\/hrms-frontend-.*-bilal-raza-brs-projects\.vercel\.app$/, // Regex for Vercel preview URLs
];

const corsOptions = {
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

// ✅ CORS setup
app.use(cors(corsOptions));

// Parse JSON & cookies
app.use(express.json());
app.use(cookieParser());

// Test route
app.get("/", (req, res) => {
  res.send("Backend running on Vercel 🚀");
});

// API routes
app.use("/api", require("../routes/routes"));

module.exports = app;
