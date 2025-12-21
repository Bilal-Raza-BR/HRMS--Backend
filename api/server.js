const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");

const connectDB = require("../config/db");

dotenv.config();

const app = express();

// ===== DB Connection (SAFE VERSION) =====
let isConnected = false;

const dbConnect = async () => {
  if (isConnected) return;

  try {
    await connectDB();
    isConnected = true;
    console.log("✅ DB Connected");
  } catch (err) {
    console.error("❌ DB Connection Failed:", err.message);
  }
};

// ⚠️ DB connect once (NOT per request)
dbConnect();

// ===== CORS =====
app.use(
  cors({
    origin: [
      "https://hrms-frontend-rosy-omega.vercel.app",
      "https://hrms-frontend-git-main-bilal-raza-brs-projects.vercel.app",
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// ===== Test Route =====
app.get("/", (req, res) => {
  res.send("Backend API is running 🚀");
});

// ===== Routes =====
app.use("/api", require("../routes/routes"));

module.exports = app;
