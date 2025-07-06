const jwt = require("jsonwebtoken");

const verifyOwner = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.TOKEN_KEY);
    if (decoded.role !== "superadmin") {
      return res.status(403).json({ message: "Only owner access allowed." });
    }

    req.owner = decoded;
    next();
  } catch (error) {
    return res.status(400).json({ message: "Invalid token." });
  }
};

module.exports = verifyOwner;
