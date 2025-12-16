const Company = require("../modals/companyModel");
const { startOfDay, endOfDay, startOfMonth, endOfMonth, parseISO } = require("date-fns");

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

const getTodaysAttendance = async (req, res) => {
  try {
    const { slug } = req.params;
    const { role } = req.user;

    if (role !== "admin" && role !== "hr") {
      return res.status(403).json({ message: "Access denied." });
    }

    const company = await Company.findOne({ slug }).select("users");
    if (!company) {
      return res.status(404).json({ message: "Company not found." });
    }

    const today = new Date();
    const start = startOfDay(today);
    const end = endOfDay(today);

    const attendanceData = company.users
      .filter(user => user.role !== 'admin') // Admins ko list se exclude karein
      .map(user => {
        const attendanceRecord = user.attendance.find(att => {
          const attDate = new Date(att.date);
          return attDate >= start && attDate <= end;
        });

        return {
          userId: user._id,
          name: user.name,
          email: user.email,
          profilePic: user.profilePic,
          status: attendanceRecord ? attendanceRecord.status : "not-marked",
        };
      });

    res.status(200).json({ data: attendanceData });

  } catch (error) {
    console.error("Error fetching today's attendance:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

const manualMarkAttendance = async (req, res) => {
  try {
    const { slug } = req.params;
    const { userId, status } = req.body;
    const { role } = req.user;

    if (role !== "admin" && role !== "hr") {
      return res.status(403).json({ message: "Access denied." });
    }

    if (!userId || !status) {
      return res.status(400).json({ message: "User ID and status are required." });
    }

    const today = new Date();
    const start = startOfDay(today);

    // Pehle se mojood aaj ki attendance ko remove karein
    await Company.updateOne(
      { slug, "users._id": userId },
      {
        $pull: { "users.$.attendance": { date: { $gte: startOfDay(today), $lte: endOfDay(today) } } }
      }
    );

    // Nayi attendance add karein
    const updateResult = await Company.updateOne(
      { slug, "users._id": userId },
      {
        $push: { "users.$.attendance": { date: start, status: status } }
      }
    );

    if (updateResult.nModified === 0 && updateResult.matchedCount === 0) {
        return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({ message: `Attendance marked as ${status}.` });

  } catch (error) {
    console.error("Error in manual mark:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

const markRemainingAsAbsent = async (req, res) => {
  try {
    const { slug } = req.params;
    const { role } = req.user;

    if (role !== "admin" && role !== "hr") {
      return res.status(403).json({ message: "Access denied." });
    }

    const company = await Company.findOne({ slug });
    if (!company) return res.status(404).json({ message: "Company not found." });

    const today = new Date();
    const start = startOfDay(today);
    const end = endOfDay(today);
    let usersMarked = 0;

    for (const user of company.users) {
      if (user.role === 'admin') continue;

      const hasAttendanceToday = user.attendance.some(att => new Date(att.date) >= start && new Date(att.date) <= end);

      if (!hasAttendanceToday) {
        user.attendance.push({ date: start, status: "absent" });
        usersMarked++;
      }
    }

    await company.save();
    res.status(200).json({ message: `${usersMarked} remaining users have been marked as absent.` });

  } catch (error) {
    console.error("Error marking remaining as absent:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

const getMonthlyUserAttendance = async (req, res) => {
  try {
    const { slug, userId } = req.params;
    const { month } = req.query; // Expecting month in 'YYYY-MM' format
    const { role } = req.user;

    if (role !== "admin" && role !== "hr") {
      return res.status(403).json({ message: "Access denied." });
    }

    const targetDate = month ? parseISO(`${month}-01`) : new Date();
    const start = startOfMonth(targetDate);
    const end = endOfMonth(targetDate);

    // Efficiently find the company and the specific user
    const company = await Company.findOne({ slug, "users._id": userId }, { "users.$": 1 });

    if (!company || !company.users || company.users.length === 0) {
      return res.status(404).json({ message: "User not found in this company." });
    }

    const user = company.users[0];

    const monthlyAttendance = user.attendance.filter(att => {
      const attDate = new Date(att.date);
      return attDate >= start && attDate <= end;
    });

    res.status(200).json({ userName: user.name, attendance: monthlyAttendance });

  } catch (error) {
    console.error("Error fetching monthly user attendance:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = { markAttendance, getMyAttendance, getTodaysAttendance, manualMarkAttendance, markRemainingAsAbsent, getMonthlyUserAttendance };
