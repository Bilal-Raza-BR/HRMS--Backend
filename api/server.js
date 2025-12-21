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
// Manual Middleware: Ye har request par zabardasti headers lagayega
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  res.setHeader("Access-Control-Allow-Credentials", "true");
const corsOptions = {
  origin: true, // Request karne wale URL ko automatically allow karega
  credentials: true, // Cookies allow karega
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  optionsSuccessStatus: 200
};

  // Agar browser pre-check (OPTIONS) request bheje, to yahin se OK bol do
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Pre-flight requests ko handle karega

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
