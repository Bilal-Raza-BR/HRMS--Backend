const multer = require("multer");

const storage = multer.memoryStorage(); // File as buffer
const upload = multer({ storage });

module.exports = upload;
