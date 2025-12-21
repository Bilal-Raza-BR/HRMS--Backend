const cloudinary = require("../utils/cloudinary");
const Company = require("../modals/companyModel");

// const cloudinary = require("cloudinary").v2;
// const Company = require("../models/Company");
const path = require("path");
const applyForJob = async (req, res) => {
  try {
    const { slug } = req.params;
    const { name, email, phone, position, message } = req.body;

    // 🔐 Basic validation
    if (!name || !email || !position || !req.file) {
      return res.status(400).json({
        message: "Name, email, position, and resume are required.",
      });
    }

    // 🔍 Check company
    const company = await Company.findOne({ slug });
    if (!company) {
      return res.status(404).json({ message: "Company not found." });
    }

    // 🔁 Check if already applied
    const alreadyApplied = company.applications.find(
      (app) => app.email === email && app.position === position
    );
    if (alreadyApplied) {
      return res.status(400).json({
        message: "You have already applied for this position.",
      });
    }

    // 🧠 File extension check
    const ext = path.extname(req.file.originalname).toLowerCase();
    const allowed = [".pdf", ".doc", ".docx"];

    if (!allowed.includes(ext)) {
      return res
        .status(400)
        .json({ message: "Only PDF, DOC, or DOCX files are allowed." });
    }

    // ☁️ Upload to Cloudinary (RAW to avoid force-download)
  const streamUpload = () =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
        folder: "hrms-resumes",
        public_id: req.file.originalname, // ✅ extension included
        use_filename: true,
        unique_filename: false,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    stream.end(req.file.buffer);
  });


    const uploadResult = await streamUpload();

    // ✅ Convert raw URL to previewable URL
    const previewUrl = uploadResult.secure_url.replace("/raw/upload/", "/image/upload/");

    // 💾 Save to DB
    company.applications.push({
      name,
      email,
      phone,
      position,
      resume: previewUrl, // ✅ directly previewable in iframe
      message,
    });

    await company.save();

    return res
      .status(201)
      .json({ message: "Application submitted successfully!" });
  } catch (error) {
    console.error("Apply error:", error);
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
    const {
      email: applicantEmail,
      position,
      status,
      roleToAssign,
      name: applicantName, // ✅ name bhi le rahe hain
    } = req.body;

    const { email: hrEmail, role } = req.user;

    if (!["admin", "hr"].includes(role)) {
      return res.status(403).json({ message: "Only admin or HR can update status." });
    }

    if (
      !applicantEmail ||
      !position ||
      !["accepted", "rejected", "hired"].includes(status)
    ) {
      return res.status(400).json({ message: "Email, position, and valid status are required." });
    }

    if (status === "hired") {
      const validRoles = ["employee", "hr"];
      if (!roleToAssign || !validRoles.includes(roleToAssign)) {
        return res.status(400).json({ message: "Valid roleToAssign is required for hiring." });
      }
      if (!applicantName) {
        return res.status(400).json({ message: "Applicant name is required for hiring." });
      }
    }

    const company = await Company.findOne({ slug });
    if (!company) {
      return res.status(404).json({ message: "Company not found." });
    }

    const hrUser = company.users.find((u) => u.email === hrEmail);
    if (!hrUser) {
      return res.status(403).json({ message: "You are not part of this company." });
    }

    const application = company.applications.find(
      (app) => app.email === applicantEmail && app.position === position
    );

    if (!application) {
      return res.status(404).json({ message: "Application not found." });
    }

    application.status = status;
    await company.save();

    if (status === "accepted") {
      const subject = `You're shortlisted for ${position}`;
      const html = `
        <h2>Congratulations! 🎉</h2>
        <p>Your application for <strong>${position}</strong> at <strong>${company.name}</strong> has been shortlisted.</p>
        <p>We’ll contact you soon regarding the interview process. Stay tuned!</p>
      `;
      await sendEmail(applicantEmail, subject, html);
    }

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

    if (status === "hired") {
      const token = jwt.sign(
        {
          companyId: company._id,
          companySlug: company.slug,
          role: roleToAssign,
          email: applicantEmail,
          name: applicantName, // ✅ name token me
        },
        process.env.TOKEN_KEY,
        { expiresIn: "2d" }
      );

      const inviteLink = `https://hrms-frontend-rosy-omega.vercel.app/companyInvite?token=${token}`;
      const subject = `You're hired at ${company.name}`;
      const html = `
        <div style="font-family: Arial, sans-serif;">
          <div style="text-align:center; background:#0d47a1; padding:20px;">
            <img src="${company.logo}" alt="logo" style="height: 60px;"/>
            <h2 style="color:white;">${company.name}</h2>
          </div>
          <div style="padding:20px;">
            <h3>🎉 You're Hired!</h3>
            <p>Dear ${applicantName},<br/>You’ve been selected for <strong>${position}</strong>.</p>
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
      application,
    });

  } catch (error) {
    console.error("Application status update error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const manualInviteUser = async (req, res) => {
  try {
    const { email, role } = req.body;
    const { slug } = req.params;
    const { role: senderRole } = req.user;

    if (senderRole !== 'admin') {
      return res.status(403).json({ message: "Access denied. Only admins can invite users." });
    }

    if (!email || !role) {
      return res.status(400).json({ message: "Email and role are required." });
    }

    const company = await Company.findOne({ slug });
    if (!company) {
      return res.status(404).json({ message: "Company not found." });
    }

    const existingUser = company.users.find(u => u.email === email);
    if (existingUser) {
      return res.status(409).json({ message: `User with email ${email} is already a member of this company.` });
    }

    const token = jwt.sign(
      { email, role, companyId: company._id, companySlug: company.slug },
      process.env.TOKEN_KEY,
      { expiresIn: "2d" }
    );

    const inviteLink = `https://hrms-frontend-rosy-omega.vercel.app/companyInvite?token=${token}`;
    const subject = `Invitation to join ${company.name}`;
    const html = `
      <div style="font-family: sans-serif;">
        <h2>You're invited to join ${company.name}</h2>
        <p>Click the button below to complete your profile and join:</p>
        <a href="${inviteLink}" style="padding: 10px 20px; background: #1976d2; color: white; text-decoration: none;">Join Now</a>
        <p>This link will expire in 2 days.</p>
      </div>
    `;

    await sendEmail(email, subject, html);
    res.status(200).json({ message: "Invite sent successfully." });
  } catch (error) {
    console.error("Manual invite error:", error);
    res.status(500).json({ message: "Failed to send invite." });
  }
};

const deleteApplication = async (req, res) => {
  try {
    const { slug } = req.params;
    const { role } = req.user;
    const { applicationId } = req.body;

    // ✅ Role validation
    if (!["admin", "hr"].includes(role)) {
      return res.status(403).json({ message: "Access denied. Only admin or HR can delete applications." });
    }

    if (!applicationId) {
      return res.status(400).json({ message: "Application ID is required." });
    }

    const company = await Company.findOne({ slug });
    if (!company) {
      return res.status(404).json({ message: "Company not found." });
    }

    // Check if the application exists before pulling
    const applicationExists = company.applications.some(app => app._id.toString() === applicationId);
    if (!applicationExists) {
      return res.status(404).json({ message: "Application not found." });
    }

    // Pull/remove the subdocument from the applications array
    company.applications.pull({ _id: applicationId });
    await company.save();

    res.status(200).json({ message: "Application has been deleted successfully." });

  } catch (error) {
    console.error("Delete application error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const deleteAllApplications = async (req, res) => {
  try {
    const { slug } = req.params;
    const { role } = req.user;

    // ✅ Role validation: Only admin can perform this action
    if (role !== "admin") {
      return res.status(403).json({ message: "Access denied. Only admin can delete all applications." });
    }

    const company = await Company.findOne({ slug });
    if (!company) {
      return res.status(404).json({ message: "Company not found." });
    }

    // Clear the applications array
    company.applications = [];
    await company.save();

    res.status(200).json({ message: "All applications for the company have been deleted." });

  } catch (error) {
    console.error("Delete all applications error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { applyForJob , getAllApplications , updateApplicationStatus, manualInviteUser, deleteApplication, deleteAllApplications };
