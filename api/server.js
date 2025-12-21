const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const connectDB = require("../config/db");

dotenv.config();

const app = express();

// DB connect
connectDB();

// ✅ CORS OPTIONS (bahar define)
const corsOptions = {
  origin: true, // frontend auto allow
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

// ✅ CORS use karo
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

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
