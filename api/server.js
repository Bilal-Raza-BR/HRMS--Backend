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
const corsOptions = {
  credentials: true,
  origin: (origin, callback) => {
    // Agar request Postman ya mobile app se hai (jiska origin nahi hota) to ijazat do.
    if (!origin) return callback(null, true);

    // Agar origin aapke Vercel project se match karta hai to ijazat do.
    // Yeh aapke tamam frontend deployments (e.g., hrms-frontend-*) ke liye kaam karega.
    if (origin.endsWith("-bilal-raza-brs-projects.vercel.app")) {
      return callback(null, true);
    }

    callback(new Error("Not allowed by CORS"));
  },
};
app.use(cors(corsOptions));

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
