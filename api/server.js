const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const connectDB = require("../config/db");

dotenv.config();

const app = express();

// DB connect
connectDB();

// ✅ CORS CONFIG (ONLY THIS)
const corsOptions = {
  origin: [
    "https://hrms-frontend-rosy-omega.vercel.app",
    "https://hrms-frontend-git-main-bilal-raza-brs-projects.vercel.app",
    "https://hrms-frontend-ct7tngh1p-bilal-raza-brs-projects.vercel.app"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // ✅ preflight fix

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
