const Company = require("../modals/companyModel");

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

const updateUserStatus = async (req, res) => {
  try {
    const { slug } = req.params;
    const { email: userToUpdateEmail, status } = req.body;
    const { role, companySlug } = req.user;

    // ✅ Security checks
    if (role !== "admin" && role !== "hr") {
      return res.status(403).json({ message: "Only Admin or HR can update user status." });
    }

    if (slug !== companySlug) {
      return res.status(403).json({ message: "Access denied for this company." });
    }

    // ✅ Input validation
    if (!userToUpdateEmail || !status) {
      return res.status(400).json({ message: "Email and status are required." });
    }

    // Status ko schema ke enum ke mutabiq validate karein
    if (!['active', 'terminated'].includes(status)) {
      return res.status(400).json({ message: "Invalid status value. Must be 'active' or 'terminated'." });
    }

    const company = await Company.findOne({ slug });
    if (!company) {
      return res.status(404).json({ message: "Company not found." });
    }

    // ✅ User ko dhoond kar update karein
    const user = company.users.find(u => u.email === userToUpdateEmail);
    if (!user) {
      return res.status(404).json({ message: "User not found in this company." });
    }

    // ✅ Status update karein
    user.status = status;

    await company.save();

    res.status(200).json({ message: `User status updated to '${status}' successfully.` });

  } catch (error) {
    console.error("Update user status error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { slug } = req.params;
    const { email: userToDeleteEmail } = req.body;
    const { role, companySlug } = req.user;

    // ✅ Security checks
    if (role !== "admin") {
      return res.status(403).json({ message: "Only admin can delete users." });
    }

    if (slug !== companySlug) {
      return res.status(403).json({ message: "Access denied for this company." });
    }

    // ✅ Input validation
    if (!userToDeleteEmail) {
      return res.status(400).json({ message: "User email is required." });
    }

    // Pehle company ko dhoondein
    const company = await Company.findOne({ slug });
    if (!company) {
      return res.status(404).json({ message: "Company not found." });
    }

    // User ko dhoond kar uski details lein
    const userToDelete = company.users.find(u => u.email === userToDeleteEmail);

    if (!userToDelete) {
      return res.status(404).json({ message: "User not found in this company." });
    }

    // Admin khud ko ya kisi aur admin ko delete na kar sake
    if (userToDelete.role === 'admin') {
      return res.status(400).json({ message: "Admin users cannot be deleted." });
    }

    // User ko 'users' array se remove karein
    company.users.pull({ _id: userToDelete._id });
    await company.save();

    res.status(200).json({ message: `User ${userToDeleteEmail} has been deleted successfully.` });

  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = { updateUserSalary, updateUserStatus, deleteUser };
