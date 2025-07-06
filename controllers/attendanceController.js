const Company = require("../modals/companyModel");

const markAttendance = async (req, res) => {
  try {
    const { slug } = req.params;
    const userEmail = req.user.email;

    // ✅ Optional: frontend se date aaye warna today
    const { date, status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is required (present/absent)." });
    }

    const attendanceDate = date || new Date().toISOString().split("T")[0]; // yyyy-mm-dd

    // ✅ Find company
    const company = await Company.findOne({ slug });
    if (!company) {
      return res.status(404).json({ message: "Company not found." });
    }

    // ✅ Find user inside company
    const user = company.users.find(u => u.email === userEmail);
    if (!user) {
      return res.status(404).json({ message: "User not found in this company." });
    }

    // ✅ Check if already marked
    const alreadyMarked = user.attendance?.some(a => a.date === attendanceDate);
    if (alreadyMarked) {
      return res.status(400).json({ message: "Attendance already marked for today." });
    }

    // ✅ Add attendance
    if (!user.attendance) user.attendance = [];

    user.attendance.push({
      date: attendanceDate,
      status: status.toLowerCase()
    });

    await company.save();

    res.status(201).json({ message: "Attendance marked successfully." });
  } catch (error) {
    console.error("Attendance error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


// const Company = require("../models/companyModel");

const getMyAttendance = async (req, res) => {
  try {
    const { slug } = req.params;
    const { email } = req.user;

    const company = await Company.findOne({ slug });
    if (!company) {
      return res.status(404).json({ message: "Company not found." });
    }

    const user = company.users.find(u => u.email === email);
    if (!user) {
      return res.status(404).json({ message: "User not found in this company." });
    }

    res.status(200).json({
      message: "Attendance fetched.",
      attendance: user.attendance || []
    });
  } catch (error) {
    console.error("Attendance fetch error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};





module.exports = { markAttendance , getMyAttendance };
