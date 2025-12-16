const Company = require("../modals/companyModel");

const getDashboardData = async (req, res) => {
  try {
    const { slug } = req.params;
    const { email, role } = req.user;

    const company = await Company.findOne({ slug });
    if (!company) {
      return res.status(404).json({ message: "Company not found." });
    }

    const userInCompany = company.users.find(u => u.email === email);
    if (!userInCompany) {
      return res.status(404).json({ message: "User not found in this company." });
    }

    // Common data for all roles
    const responseData = {
      companyName: company.name,
      logoUrl: company.logoUrl,
      data: company, // Full company object for frontend flexibility
    };

    // Role-specific data can be added here if needed in the future
    if (role === 'admin') {
      // Add any admin-specific stats if you want
    }

    res.status(200).json({
      message: "Dashboard data fetched successfully",
      ...responseData
    });

  } catch (error) {
    console.error("Dashboard data error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { getDashboardData };
