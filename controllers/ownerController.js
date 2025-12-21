const Request = require("../modals/requestModel");

// GET /api/admin/requests
const getAllRequests = async (req, res) => {
  try {
    const requests = await Request.find().sort({ createdAt: -1 }); // Latest first

    res.status(200).json({
      total: requests.length,
      requests,
    });
  } catch (error) {
    console.error("Error fetching requests:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// PATCH /api/admin/request/:id/handled
const markRequestHandled = async (req, res) => {
  try {
    const requestId = req.params.id;
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value." });
    }

    const updated = await Request.findByIdAndUpdate(
      requestId,
      { isHandled: true, handledStatus: status }, // FIX: status bhi save karo
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Request not found." });
    }

    res.status(200).json({
      message: "Request marked as handled.",
      updatedRequest: updated,
    });
  } catch (error) {
    console.error("Error marking request as handled:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const sendEmail = require("../utils/sendEmail");
const jwt = require("jsonwebtoken"); // ✅ import required

const sendInvite = async (req, res) => {
  try {
    const { email, industry, companyName } = req.body;

    if (!email || !industry || !companyName) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // ✅ JWT Token for secure invite
    const token = jwt.sign(
      {companyName , email, industry, role: "admin" },
      process.env.TOKEN_KEY,
      { expiresIn: "2d" }
    );

    const link = `https://hrms-frontend-rosy-omega.vercel.app/invite?token=${token}`;


    const html = `
      <div style="font-family: sans-serif; max-width: 500px;">
        <img src="https://static.wixstatic.com/media/7d0a46_9dfd0747f3014c78be9dce782dfcf377~mv2.png" style="width: 120px; margin-bottom: 10px;" alt="HRMS Logo"/>
        <h2>You're Invited to HRMS Solutions</h2>
        <p>Hello <strong>${companyName}</strong>,</p>
        <p>Click the button below to complete your company registration on our HRMS platform:</p>
        <a href="${link}" style="display: inline-block; margin-top: 12px; padding: 12px 20px; background-color: #007bff; color: #fff; border-radius: 5px; text-decoration: none;">
          Complete Registration
        </a>
        <p style="margin-top: 20px;">This link will expire in 2 days.</p>
        <br/>
        <p>Regards,<br/>HRMS Solutions Team</p>
      </div>
    `;

    await sendEmail(email, "HRMS Invite Link", html);

    res.status(200).json({ message: "Invite sent successfully" });
  } catch (error) {
    console.error("Error sending invite:", error);
    res.status(500).json({ message: "Failed to send invite" });
  }
};






//owner data database me rakhwany k liye banaya tha humy ab is ki need nahi bs ek bar hi zaroorat thi

const bcrypt = require("bcryptjs");
const cloudinary = require("../utils/cloudinary");
const Owner = require("../modals/ownerModel");

const streamifier = require("streamifier");

const registerOwner = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }

    const existing = await Owner.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Owner already exists with this email." });
    }

    // ✅ Cloudinary Upload with streamifier
    let profilePicUrl = "";
    if (req.file) {
      const streamUpload = (req) => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "hrms/ownerProfilePics",
              resource_type: "image",
            },
            (error, result) => {
              if (result) resolve(result);
              else reject(error);
            }
          );

          streamifier.createReadStream(req.file.buffer).pipe(stream);
        });
      };

      const result = await streamUpload(req);
      profilePicUrl = result.secure_url;
    } else {
      return res.status(400).json({ message: "Profile picture is required." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const owner = new Owner({
      name,
      email,
      password: hashedPassword,
      phone,
      profilePic: profilePicUrl,
    });

    await owner.save();

    res.status(201).json({
      message: "Owner registered successfully",
      owner: {
        name: owner.name,
        email: owner.email,
        phone: owner.phone,
        profilePic: owner.profilePic,
        role: owner.role,
      },
    });
  } catch (error) {
    console.error("Owner registration error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// const jwt = require("jsonwebtoken");

const loginOwner = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 🔒 Validate input
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    // 🔍 Check owner exists
    const owner = await Owner.findOne({ email });
    if (!owner) {
      return res.status(404).json({ message: "Owner not found." });
    }

    // 🔑 Match password
    const isMatch = await bcrypt.compare(password, owner.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // ⏱️ Update lastLogin
    owner.lastLogin = new Date();
    await owner.save();

    // 🎟️ Create JWT token
    const token = jwt.sign(
      {
        ownerId: owner._id,
        email: owner.email,
        role: "superadmin"
      },
      process.env.TOKEN_KEY,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Login successful",
      token
    });

  } catch (error) {
    console.error("Owner login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// module.exports.loginOwner = loginOwner;
const Company = require("../modals/companyModel");

const toggleCompanyStatus = async (req, res) => {
  try {
    const { slug } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({ message: "isActive must be true or false." });
    }

    const company = await Company.findOne({ slug });

    if (!company) {
      return res.status(404).json({ message: "Company not found." });
    }

    company.isActive = isActive;
    await company.save();

    res.status(200).json({
      message: `Company status updated to ${isActive ? "active" : "inactive"}.`,
      company: {
        name: company.name,
        slug: company.slug,
        isActive: company.isActive
      }
    });
  } catch (error) {
    console.error("Company status update error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// module.exports.toggleCompanyStatus = toggleCompanyStatus;

// GET total companies, blocked companies, and total employees
// const Company = require("../modals/companyModel");
// const User = require("../modals/userModel");

const getCompanyStats = async (req, res) => {
  try {
     const companies = await Company.find()
    const totalCompanies = await Company.countDocuments();
    const blockedCompanies = await Company.countDocuments({ isActive: false });
    const activeCompanies = await Company.countDocuments({ isActive: true });
    // const totalEmployees = await Company.users.countDocuments({ role: "employee" });?

    res.status(200).json({
      totalCompanies,
      blockedCompanies,
activeCompanies,
      companies
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ message: "Failed to get stats" });
  }
};
//***************************************** */
// const getCompany = async (req, res) => {
//   try {
//     console.log("🟢 Route hit hua");

//     const allCompanies = await Company.find();
//     console.log("Companies found:", allCompanies.length);

//     res.status(200).json({ companies: allCompanies });
//   } catch (error) {
//     console.log("❌ Error fetching companies:", error.message);
//     res.status(500).json({ message: "Server Error (getAllCompany)" });
//   }
// };
const getCompany = async (req, res) => {
  try {
     const companies = await Company.find()
   
  

    res.status(200).json({
    companies
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ message: "Failed to get stats" });
  }
};
//******************************************* */

const getOwnerProfile = async (req, res) => {
  try {
    const ownerId = req.user?.ownerId;

    if (!ownerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const owner = await Owner.findById(ownerId).select("-password");

    if (!owner) {
      return res.status(404).json({ message: "Owner not found" });
    }

    res.status(200).json({ owner });
  } catch (error) {
    console.error("Error fetching owner profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//**************************************** */

const deleteRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await Request.findByIdAndDelete(id);

    if (!request) {
      return res.status(404).json({ message: "Request not found." });
    }

    res.status(200).json({ message: "Request deleted successfully." });
  } catch (error) {
    console.error("Error deleting request:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const deleteAllRequests = async (req, res) => {
  try {
    await Request.deleteMany({});
    res.status(200).json({ message: "All requests have been deleted." });
  } catch (error) {
    console.error("Error deleting all requests:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const deleteCompany = async (req, res) => {
  try {
    const { slug } = req.params;
    const company = await Company.findOneAndDelete({ slug });

    if (!company) {
      return res.status(404).json({ message: "Company not found." });
    }

    // Optional: Delete associated logo from Cloudinary if it exists
    if (company.logoUrl) {
      const publicId = company.logoUrl.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`hrms/logos/${publicId}`);
    }

    res.status(200).json({ message: "Company deleted successfully." });
  } catch (error) {
    console.error("Error deleting company:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
//**************************************** */


module.exports = {
  getAllRequests,
  markRequestHandled,
  sendInvite, // 👈 isko export karna mat bhool
  registerOwner,
  loginOwner,
   toggleCompanyStatus,
   getCompanyStats,
   getOwnerProfile,
   getCompany,
   deleteRequest,
   deleteAllRequests,
   deleteCompany

};
