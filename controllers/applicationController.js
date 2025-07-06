const cloudinary = require("../utils/cloudinary");
const Company = require("../modals/companyModel");

const applyForJob = async (req, res) => {
  try {
    const { slug } = req.params;
    const { name, email, phone, position, message } = req.body;

    if (!name || !email || !position || !req.file) {
      return res.status(400).json({ message: "Name, email, position, and resume are required." });
    }

    const company = await Company.findOne({ slug });
    if (!company) {
      return res.status(404).json({ message: "Company not found." });
    }

    const alreadyApplied = company.applications.find(
      app => app.email === email && app.position === position
    );
    if (alreadyApplied) {
      return res.status(400).json({ message: "You have already applied for this position." });
    }

    // Upload resume to Cloudinary
    const result = await cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder: "hrms-resumes"
      },
      async (error, uploadResult) => {
        if (error) {
          console.error("Cloudinary error:", error);
          return res.status(500).json({ message: "Resume upload failed." });
        }

        // Save in company
        company.applications.push({
          name,
          email,
          phone,
          position,
          resume: uploadResult.secure_url,
          message
        });

        await company.save();

        res.status(201).json({ message: "Application submitted successfully!" });
      }
    );

    // Pipe file to stream
    result.end(req.file.buffer);

  } catch (error) {
    console.error("Application error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


const getAllApplications = async (req, res) => {
  try {
    const { slug } = req.params;
    const { email, role } = req.user;

    if (!["admin", "hr"].includes(role)) {
      return res.status(403).json({ message: "Access denied. Only admin or HR can view applications." });
    }

    const company = await Company.findOne({ slug });
    if (!company) {
      return res.status(404).json({ message: "Company not found." });
    }

    const currentUser = company.users.find(u => u.email === email);
    if (!currentUser) {
      return res.status(403).json({ message: "User not part of this company." });
    }

    res.status(200).json({
      message: "All applications fetched successfully.",
      applications: company.applications || []
    });
  } catch (error) {
    console.error("Get applications error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// const Company = require("../models/companyModel");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail");

const updateApplicationStatus = async (req, res) => {
  try {
    const { slug } = req.params;
    const { email: applicantEmail, position, status, roleToAssign } = req.body;
    const { email: hrEmail, role } = req.user;

    // ✅ Validate role
    if (!["admin", "hr"].includes(role)) {
      return res.status(403).json({ message: "Only admin or HR can update status." });
    }

    // ✅ Validate input
    if (!applicantEmail || !position || !["accepted", "rejected", "hired"].includes(status)) {
      return res.status(400).json({ message: "Email, position, and valid status are required." });
    }

    const company = await Company.findOne({ slug });
    if (!company) {
      return res.status(404).json({ message: "Company not found." });
    }

    const hrUser = company.users.find(u => u.email === hrEmail);
    if (!hrUser) {
      return res.status(403).json({ message: "You are not part of this company." });
    }

    const application = company.applications.find(
      (app) => app.email === applicantEmail && app.position === position
    );

    if (!application) {
      return res.status(404).json({ message: "Application not found." });
    }

    // ✅ Update status
    application.status = status;
    await company.save();

    // ✅ Accepted Email
    if (status === "accepted") {
      const subject = `You're shortlisted for ${position}`;
      const html = `
        <h2>Congratulations! 🎉</h2>
        <p>Your application for <strong>${position}</strong> at <strong>${company.name}</strong> has been shortlisted.</p>
        <p>We’ll contact you soon regarding the interview process. Stay tuned!</p>
      `;
      await sendEmail(applicantEmail, subject, html);
    }

    // ✅ Rejected Email
    if (status === "rejected") {
      const subject = `Application update - ${company.name}`;
      const html = `
        <h2>Thank you for applying 🙏</h2>
        <p>We truly appreciate your interest in <strong>${position}</strong>.</p>
        <p>However, we’ve decided not to move forward at this time. Please don’t hesitate to apply again in future.</p>
        <p>We wish you the best of luck ahead! 💙</p>
      `;
      await sendEmail(applicantEmail, subject, html);
    }

    // ✅ Hired → Send Invite Email
    if (status === "hired") {
  const token = jwt.sign(
    {
      companyId: company._id,
      companySlug: company.slug,
      role: roleToAssign || "employee",
      email: applicantEmail,
    },
    process.env.TOKEN_KEY,
    { expiresIn: "2d" }
  );

  const inviteLink = `http://localhost:3000/invite?token=${token}`;
  const subject = `You're hired at ${company.name}`;
  const html = `
    <div style="font-family: Arial, sans-serif;">
      <div style="text-align:center; background:#0d47a1; padding:20px;">
        <img src="${company.logo}" alt="logo" style="height: 60px;"/>
        <h2 style="color:white;">${company.name}</h2>
      </div>
      <div style="padding:20px;">
        <h3>🎉 You're Hired!</h3>
        <p>Dear Candidate,<br/>You’ve been selected for <strong>${position}</strong>.</p>
        <p>Click below to create your HRMS account:</p>
        <a href="${inviteLink}" style="display:inline-block; padding:10px 20px; background:#0d47a1; color:white; text-decoration:none; border-radius:5px;">
          Accept Offer
        </a>
        <p>This link will expire in 2 days.</p>
      </div>
    </div>
  `;

  await sendEmail(applicantEmail, subject, html);
}


    res.status(200).json({
      message: `Application marked as ${status}.`,
      application
    });

  } catch (error) {
    console.error("Application status update error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};





module.exports = { applyForJob , getAllApplications , updateApplicationStatus  };
