const Request = require("../modals/requestModel");

// POST /api/request-service
const createRequest = async (req, res) => {
  try {
    const {
      companyName,
      companyEmail,
      industry,
      contactPerson,
      phone,
      message
    } = req.body;
    
 // ✅ Validation
if (!companyName || !companyEmail || !industry || !contactPerson || !phone) {
      return res.status(400).json({ message: "Please fill all required fields." });
    }

    // Check if request already exists
    const existing = await Request.findOne({ companyEmail });
    if (existing) {
      return res.status(400).json({ message: "Request already received from this email." });
    }

    // Create new request
    const request = new Request({
      companyName,
      companyEmail,
      industry,
      contactPerson,
      phone,
      message
    });

    await request.save();

    res.status(201).json({ message: "Your request has been submitted successfully!" });
  } catch (error) {
    console.error("Error creating request:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = createRequest