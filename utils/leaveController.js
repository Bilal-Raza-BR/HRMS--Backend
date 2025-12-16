const Company = require("../modals/companyModel");
const sendEmail = require("../utils/sendEmail");

const applyLeave = async (req, res) => {
  try {
    const { slug } = req.params;
    const userEmail = req.user.email;

    const { leaveType, startDate, endDate, reason } = req.body;

    // ✅ Validation
    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({ message: "Leave type, start date, end date, and reason are all required." });
    }

    const company = await Company.findOne({ slug });
    if (!company) {
      return res.status(404).json({ message: "Company not found." });
    }

    const user = company.users.find(u => u.email === userEmail);
    if (!user) {
      return res.status(404).json({ message: "User not found in this company." });
    }

    if (!user.leaves) user.leaves = [];

    user.leaves.push({
      leaveType,
      startDate,
      endDate,
      reason,
      status: "pending"
    });
    await company.save();

    res.status(201).json({ message: "Leave application submitted." });
  } catch (error) {
    console.error("Leave apply error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateLeaveStatus = async (req, res) => {
  try {
    const { slug } = req.params;
    const { role } = req.user;
    const { leaveId, status } = req.body;

    if (role !== "admin" && role !== "hr") {
      return res.status(403).json({ message: "Access denied." });
    }

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Status must be approved or rejected." });
    }

    if (!leaveId) {
      return res.status(400).json({ message: "Leave ID is required." });
    }

    const company = await Company.findOne({ slug, "users.leaves._id": leaveId });
    if (!company) {
      return res.status(404).json({ message: "Leave request not found in this company." });
    }

    let userToNotify;
    company.users.forEach(user => {
      const leave = user.leaves.id(leaveId);
      if (leave) {
        leave.status = status;
        userToNotify = user;
      }
    });

    if (!userToNotify) {
      return res.status(404).json({ message: "Could not find the user for this leave request." });
    }

    await company.save();

    res.status(200).json({ message: `Leave request has been ${status}.` });

    // Send email notification to the user
    try {
      const subject = `Your Leave Request has been ${status}`;
      const message = `
        <p>Hi ${userToNotify.name},</p>
        <p>This is to inform you that your leave request has been <strong>${status}</strong> by the administration.</p>
        <p>Thank you for using our HRMS.</p>
      `;

      await sendEmail({
        email: userToNotify.email,
        subject,
        message,
      });
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      // Don't block the main response for email failure
    }

  } catch (error) {
    console.error("Error updating leave status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getAllLeaveRequests = async (req, res) => {
  try {
    const { slug } = req.params;
    const { email, role } = req.user;

    if (!["admin", "hr"].includes(role)) {
      return res.status(403).json({ message: "Access denied. Only admin or HR can view all leaves." });
    }

    const company = await Company.findOne({ slug });
    if (!company) {
      return res.status(404).json({ message: "Company not found." });
    }

    const allLeaveRequests = [];
    company.users.forEach(user => {
      if (user.leaves && user.leaves.length > 0) {
        user.leaves.forEach(leave => {
          const leaveObject = leave.toObject();
          leaveObject.user = {
            name: user.name,
            email: user.email,
            profilePic: user.profilePic,
          };
          allLeaveRequests.push(leaveObject);
        });
      }
    });

    // Sort by most recent
    allLeaveRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    console.log(allLeaveRequests);
    
    res.status(200).json({
      message: "All leave requests fetched.",
      data: allLeaveRequests
    });

  } catch (error) {
    console.error("Get all leaves error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};





module.exports = { applyLeave, updateLeaveStatus, getAllLeaveRequests };
