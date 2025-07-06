const Company = require("../modals/companyModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const loginUserBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const { email, password } = req.body;

    // ✅ Validation
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    // ✅ Company find karo by slug
    const company = await Company.findOne({ slug });
    if (!company) {
      return res.status(404).json({ message: "Company not found." });
    }

    // ✅ Company ke users[] me email dhoondo
    const user = company.users.find((u) => u.email === email);
    if (!user) {
      return res.status(404).json({ message: "User not found in this company." });
    }
   
    if (!company.isActive) {
  return res.status(403).json({
    message: "Company service is currently inactive. Please contact the administrator.",
  });
}




    // ✅ Password match karo
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password." });
    }

    // ✅ Token banao
    const token = jwt.sign(
      {
        companySlug: slug,
        userId: user._id,
        role: user.role,
        email: user.email
      },
      process.env.TOKEN_KEY,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        gender: user.gender
      },
      company: {
        name: company.name,
        slug: company.slug
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { loginUserBySlug };
