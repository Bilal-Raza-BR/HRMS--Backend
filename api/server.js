const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");

const connectDB = require("../config/db");

dotenv.config();

const app = express();

// ⚠️ DB connection (serverless-safe way)
let isConnected = false;
const dbConnect = async () => {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
};

app.use(async (req, res, next) => {
  await dbConnect();
  next();
});

app.use(cors());
app.use(express.json());
app.use(cookieParser());
//test route
app.get("/", (req, res) => {
  res.send("Backend API is running 🚀");
});
// Routes
app.use("/api", require("../routes/routes"));

// ❌ app.listen hata diya
module.exports = app;
