const Company = require("../modals/companyModel");

const getMyDashboard = async (req, res) => {
  try {
    const { slug } = req.params;
    const userEmail = req.user.email;
    const userRole = req.user.role;

    const company = await Company.findOne({ slug });
    if (!company) {
      return res.status(404).json({ message: "Company not found." });
    }

    const user = company.users.find((u) => u.email === userEmail);
    if (!user) {
      return res.status(404).json({ message: "User not found in this company." });
    }

    // ✅ Role-based response
    let dashboardData = {
      welcome: `Welcome ${user.name} (${user.role})`,
      companyName: company.name
    };

    if (userRole === "admin") {
      dashboardData.totalUsers = company.users.length;
      dashboardData.revenue = 500000; // Example static data
    } else if (userRole === "hr") {
      dashboardData.totalEmployees = company.users.filter(u => u.role === "employee").length;
    } else {
      dashboardData.myProfile = user;
    }

    res.status(200).json(dashboardData);
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


const updateUserSalary = async (req, res) => {
  try {
    const { slug } = req.params;
    const { email: userToUpdateEmail, newSalary } = req.body;
    const { role, email: adminEmail, companySlug } = req.user;

    // ✅ Security checks
    if (role !== "admin") {
      return res.status(403).json({ message: "Only admin can update salary." });
    }

    if (slug !== companySlug) {
      return res.status(403).json({ message: "Access denied for this company." });
    }

    if (!userToUpdateEmail || !newSalary) {
      return res.status(400).json({ message: "Email and new salary are required." });
    }

    const company = await Company.findOne({ slug });
    if (!company) {
      return res.status(404).json({ message: "Company not found." });
    }

    // ✅ Find user to update
    const user = company.users.find(u => u.email === userToUpdateEmail);
    if (!user) {
      return res.status(404).json({ message: "User not found in this company." });
    }

    // ✅ Update salary
    user.salary = newSalary;

    await company.save();

    res.status(200).json({
      message: "Salary updated successfully.",
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        salary: user.salary
      }
    });

  } catch (error) {
    console.error("Update salary error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};



module.exports = { getMyDashboard , updateUserSalary};
