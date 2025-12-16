// const multer = require("multer");
// const path = require("path");

// // Temporary memory storage
// const storage = multer.memoryStorage();

// const fileFilter = (req, file, cb) => {
//   const allowedTypes = /jpeg|jpg|png|webp/;
//   const ext = path.extname(file.originalname).toLowerCase();
//   if (allowedTypes.test(ext)) {
//     cb(null, true);
//   } else {
//     cb(new Error("Only image files are allowed (.jpeg, .jpg, .png, .webp)"));
//   }
// };

// const upload = multer({ storage, fileFilter });

// module.exports = upload;
const multer = require("multer");
const path = require("path");

// ✅ Memory storage
const storage = multer.memoryStorage();

// ✅ Custom file filter for multiple fields
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  // 🔹 Profile pic check
  if (file.fieldname === "profilePic") {
    const allowedImageTypes = [".jpeg", ".jpg", ".png", ".webp"];
    if (allowedImageTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed for profile picture."));
    }
  }

  // 🔹 Resume check
  else if (file.fieldname === "resume") {
    const allowedResumeTypes = [".pdf", ".doc", ".docx"];
    if (allowedResumeTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF or DOC files are allowed for resume."));
    }
  }

  // 🔸 Unknown field
  else {
    cb(new Error("Invalid file field."));
  }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
