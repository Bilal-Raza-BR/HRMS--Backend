const Company = require("../modals/companyModel");

const getAdminDashboard = async (req, res) => {
  try {
    const { slug } = req.params;
    const { email, role } = req.user;

    if (role !== "admin") {
      return res.status(403).json({ message: "Only admin can access this dashboard." });
    }

    const company = await Company.findOne({ slug });
    if (!company) {
      return res.status(404).json({ message: "Company not found." });
    }

    const user = company.users.find(u => u.email === email);
    if (!user) {
      return res.status(403).json({ message: "You are not part of this company." });
    }

    const totalHRs = company.users.filter(u => u.role === "hr").length;
    const totalEmployees = company.users.filter(u => u.role === "employee").length;

    const totalApplications = company.applications.length;
    const accepted = company.applications.filter(a => a.status === "accepted").length;
    const rejected = company.applications.filter(a => a.status === "rejected").length;
    const hired = company.applications.filter(a => a.status === "hired").length;

    const totalAttendance = company.users.reduce((total, u) => {
      return total + (u.attendance ? u.attendance.length : 0);
    }, 0);

    res.status(200).json({
      message: "Admin dashboard data fetched successfully",
      data: {
        totalHRs,
        totalEmployees,
        totalApplications,
        accepted,
        rejected,
        hired,
        totalAttendance
      }
    });

  } catch (error) {
    console.error("Admin dashboard error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { getAdminDashboard };
