const Company = require("../modals/companyModel");

const applyLeave = async (req, res) => {
  try {
    const { slug } = req.params;
    const userEmail = req.user.email;

    const { fromDate, toDate, reason } = req.body;

    // ✅ Validation
    if (!fromDate || !toDate || !reason) {
      return res.status(400).json({ message: "All fields are required." });
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
      from: fromDate,
      to: toDate,
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
    const { role, email: adminEmail } = req.user;
    const { userEmail, leaveIndex, status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Status must be approved or rejected." });
    }

    if (!userEmail || leaveIndex === undefined) {
      return res.status(400).json({ message: "User email and leave index are required." });
    }

    const company = await Company.findOne({ slug });
    if (!company) {
      return res.status(404).json({ message: "Company not found." });
    }

    const currentUser = company.users.find(u => u.email === adminEmail);
    if (!currentUser || !["admin", "hr"].includes(currentUser.role)) {
      return res.status(403).json({ message: "Access denied." });
    }

    const targetUser = company.users.find(u => u.email === userEmail);
    if (!targetUser) {
      return res.status(404).json({ message: "Target user not found." });
    }

    if (!targetUser.leaves || !targetUser.leaves[leaveIndex]) {
      return res.status(400).json({ message: "Leave request not found at given index." });
    }

    targetUser.leaves[leaveIndex].status = status;

    await company.save();

    res.status(200).json({
      message: `Leave request has been ${status}.`,
      leave: targetUser.leaves[leaveIndex]
    });

  } catch (error) {
    console.error("Leave update error:", error);
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

    const currentUser = company.users.find(u => u.email === email);
    if (!currentUser) {
      return res.status(403).json({ message: "User not part of this company." });
    }

    const allLeaveData = company.users
      .filter(u => u.leaves && u.leaves.length > 0)
      .map(u => ({
        name: u.name,
        email: u.email,
        role: u.role,
        leaves: u.leaves
      }));
      
if (allLeaveData.length === 0) {
  return res.status(200).json({
    message: "No leave requests found yet.",
    data: []
  });
}

    res.status(200).json({
      message: "All leave requests fetched.",
      data: allLeaveData
    });

  } catch (error) {
    console.error("Get all leaves error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};





module.exports = { applyLeave, updateLeaveStatus, getAllLeaveRequests };
