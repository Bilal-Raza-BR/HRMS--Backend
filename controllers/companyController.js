const Company = require("../modals/companyModel");
const cloudinary = require("../utils/cloudinary");

const createCompany = async (req, res) => {
  try {
    const {
      name,
      slug,
      email,
      industry,
      website,
      phone,
      address
    } = req.body;


      // ✅ Validation
    if (!name || !slug || !email || !industry || !phone || !address) {
      return res.status(400).json({ message: "Please fill all required fields." });
    }

    // Check if slug or email already exists
    const exists = await Company.findOne({ $or: [{ slug }, { email }] });
    if (exists) {
      return res.status(400).json({ message: "Company already exists with this email or slug." });
    }

    // Upload logo (if available)
    let logoUrl = "";
    if (req.file) {
      const result = await cloudinary.uploader.upload(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
        { folder: "hrms/logos" }
      );
      logoUrl = result.secure_url;
    }

    // Create new company
    const newCompany = new Company({
      name,
      slug,
      email,
      industry,
      website,
      phone,
      address,
      logoUrl, // 👈 Now it will be set properly
    });

    await newCompany.save();

    res.status(201).json({
      message: "Company created successfully!",
      company: newCompany
    });
  } catch (error) {
    console.error("Error creating company:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};




const bcrypt = require("bcryptjs");

const createCompanyAdmin = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      gender,
      role,
      companySlug
    } = req.body;

    // ✅ Validation
    if (!name || !email || !password || !phone || !gender || !role || !companySlug) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // ✅ Find company by slug
    const company = await Company.findOne({ slug: companySlug });

    if (!company) {
      return res.status(404).json({ message: "Company not found." });
    }

    // ✅ Check if user already exists
    const existingUser = company.users.find((u) => u.email === email);
    if (existingUser) {
      return res.status(400).json({ message: "User already exists in this company." });
    }

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Create user object
    const newUser = {
      name,
      email,
      password: hashedPassword,
      phone,
      gender,
      role, // this should be "admin"
    };

    // ✅ Push user to company.users array
    company.users.push(newUser);
    await company.save();

    res.status(201).json({ message: "Company admin created successfully!" });
  } catch (error) {
    console.error("Error creating company admin:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// module.exports = {
//   createCompanyAdmin
// };


module.exports = { createCompany ,createCompanyAdmin };
