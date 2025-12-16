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
    console.log(req.file);
    
    if (req.file) {
      const result = await cloudinary.uploader.upload(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
        { folder: "hrms/logos" }
      );
      logoUrl = result.secure_url;
console.log(logoUrl);

    }
console.log("sai");

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
      companySlug,
      dob,
      address,
    } = req.body;

    // ✅ Validation
    if (!name || !email || !password || !phone || !gender || !role || !companySlug || !dob || !address) {
      return res.status(400).json({ message: "All required fields must be filled." });
    }
    // console.log(req.body);
console.log("1");

    // ✅ Find company by slug
    const company = await Company.findOne({ slug: companySlug });
    if (!company) {
      return res.status(404).json({ message: "Company not found." });
    }
console.log("2");
    // ✅ Check if user already exists
    const existingUser = company.users.find(user => user.email === email);
    if (existingUser) {
      return res.status(400).json({ message: "User already exists in this company." });
    }
console.log("3");
    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Upload profile picture (if available)
    let profilePicUrl = "";
    if (req.file) {
      const result = await cloudinary.uploader.upload(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
        { folder: "hrms/profiles" }
      );
      profilePicUrl = result.secure_url;
    }

    // ✅ Create user object
    const newUser = {
      name,
      email,
      password: hashedPassword,
      phone,
      gender,
      role, // should be "admin"
      dob: new Date(dob), // Convert string to Date object
      address,
      profilePic: profilePicUrl || "", // 👈 ADD THIS
    };
console.log("4");
    // ✅ Push user to company.users
    company.users.push(newUser);
    console.log("done");
    await company.save();
console.log("5");
    res.status(201).json({ message: "Company admin created successfully!" });
    console.log("6");
  } catch (error) {
    console.error("Error creating company admin:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const inviteCompany = async (req, res) => {
  try {
    const { companyName, email, industry } = req.body;

    // 1. Validation
    if (!companyName || !email || !industry) {
      return res.status(400).json({ message: "Company Name, Email, and Industry are required." });
    }

    // 2. Check if a user with this email exists across ALL companies
    const userExists = await Company.findOne({ "users.email": email });
    if (userExists) {
      return res.status(409).json({ message: "A user with this email already exists in the system." });
    }

    // 3. Generate a random password
    const password = Math.random().toString(36).slice(-8); // Simple random password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create a slug from the company name
    const slug = companyName.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

    // 5. Create new company with the admin user
    const newCompany = new Company({
      name: companyName,
      email: email, // Assuming company email is the admin's email for now
      industry,
      slug,
      users: [{
        name: "Admin", // Default name
        email,
        password: hashedPassword,
        role: 'admin',
      }]
    });

    await newCompany.save();

    // TODO: Send an email to the user with their login details (email and the random password)

    res.status(201).json({ message: "Company and Admin created successfully! Invitation sent." });
  } catch (error) {
    console.error("Error in inviteCompany:", error);
    // Handle potential duplicate slug error if two companies have the same name
    if (error.code === 11000) {
      return res.status(409).json({ message: "A company with a similar name (slug) already exists." });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};


// GET /api/company/public/:slug
const getPublicCompanyBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const company = await Company.findOne({ slug }).select('name logoUrl industry isApproved isActive');
console.log(company);

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

  
    res.status(200).json(company);
  } catch (error) {
    console.error("Error fetching company:", error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const searchCompanies = async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ message: 'Query is required' });

  const companies = await Company.find({
    companyName: { $regex: query, $options: 'i' }
  }).select('companyName slug');

  res.json(companies);
};



module.exports = { createCompany ,createCompanyAdmin ,getPublicCompanyBySlug,searchCompanies, inviteCompany};
