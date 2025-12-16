const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");

const connectDB = require("../config/db"); // ⚠️ path update

dotenv.config();

const app = express();

// DB connect (safe for vercel)
connectDB();

app.use(cors({
  origin: "*",
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// ✅ Root test route (VERY IMPORTANT)
app.get("/", (req, res) => {
  res.send("Backend running on Vercel 🚀");
});

// Routes
app.use("/api", require("../routes/routes")); // ⚠️ path update

// ❌ app.listen REMOVED
module.exports = app;
