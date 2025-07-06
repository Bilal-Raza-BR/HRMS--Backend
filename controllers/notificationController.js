const Company = require("../modals/companyModel");

const getMyNotifications = async (req, res) => {
  try {
    const { slug } = req.params;
    const userEmail = req.user.email;

    const company = await Company.findOne({ slug });
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    const user = company.users.find(u => u.email === userEmail);
    if (!user) {
      return res.status(404).json({ message: "User not found in this company" });
    }

    res.status(200).json({
      notifications: user.notifications || []
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


const markNotificationRead = async (req, res) => {
  try {
    const { slug, id } = req.params;
    const userEmail = req.user.email;

    const company = await Company.findOne({ slug });
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    const user = company.users.find(u => u.email === userEmail);
    if (!user) {
      return res.status(404).json({ message: "User not found in this company" });
    }

    const notification = user.notifications.find(n => n._id.toString() === id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    notification.isRead = true;
    await company.save();

    res.status(200).json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getMyNotifications,
  markNotificationRead
};
