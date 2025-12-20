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
  process.env.FRONTEND_URL,
  "https://hrms-frontend-rosy-omega.vercel.app",
  /^https:\/\/hrms-frontend-.*-bilal-raza-brs-projects\.vercel\.app$/,
];

const corsOptions = {
  origin: function (origin, callback) {
    // allow requests with no origin (Postman, server-side)
    if (!origin) return callback(null, true);

    const allowed = allowedOrigins.some((o) =>
      o instanceof RegExp ? o.test(origin) : o === origin
    );

    if (allowed) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

// ✅ CORS middleware
app.use(cors(corsOptions));

// ✅ VERY IMPORTANT (preflight)
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
