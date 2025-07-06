const multer = require("multer");
const path = require("path");

// Temporary memory storage
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (.jpeg, .jpg, .png, .webp)"));
  }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
