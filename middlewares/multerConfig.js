// // middlewares/multerConfig.js
// const multer = require("multer");
// const path = require("path");
// const fs = require("fs");
// const { v4: uuidv4 } = require("uuid"); // npm i uuid

// const uploadDir = path.join(__dirname, "..", "uploads");
// if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// // filename function using uuid to avoid collisions
// const filename = (req, file, cb) => {
//   const ext = path.extname(file.originalname).toLowerCase();
//   cb(null, `${Date.now()}-${uuidv4()}${ext}`);
// };

// // disk storage (you can swap this out for memoryStorage for cloud uploads)
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, uploadDir),
//   filename,
// });

// // file filter - tighten as needed
// const fileFilter = (req, file, cb) => {
//   const allowed = /jpeg|jpg|png|webp/;
//   const ext = path.extname(file.originalname).toLowerCase();
//   const mimetypeOk = allowed.test(file.mimetype);
//   const extOk = allowed.test(ext);
//   if (mimetypeOk && extOk) cb(null, true);
//   else cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "Only image files are allowed"));
// };

// // sensible limits
// const limits = {
//   fileSize: 5 * 1024 * 1024, // 5MB per file
//   files: 6, // default max files - routes can override if needed
// };

// const baseUpload = multer({ storage, fileFilter, limits });

// // Helper factory functions for common cases
// module.exports = {
//   // for single file fields: uploadSingle("categoryImage")
//   uploadSingle: (fieldName) => baseUpload.single(fieldName),

//   // for arrays: uploadArray("images", 4)
//   uploadArray: (fieldName, maxCount = 4) => baseUpload.array(fieldName, maxCount),

// //   // for multiple named fields: uploadFields([{name:"avatar", maxCount:1}, {...}])
// //   uploadFields: (fields) => baseUpload.fields(fields),
// //\\i dont need this for this application
//   // expose raw baseUpload if you want to customize later
//   baseUpload,
//   uploadDir,
// };


// middlewares/multerConfig.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const filename = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  cb(null, `${Date.now()}-${uuidv4()}${ext}`);
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename,
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  const ext = path.extname(file.originalname).toLowerCase();
  const mimetypeOk = allowed.test(file.mimetype);
  const extOk = allowed.test(ext);
  if (mimetypeOk && extOk) cb(null, true);
  else cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "Only image files are allowed"));
};

const limits = {
  fileSize: 5 * 1024 * 1024,
  files: 8,
};

const baseUpload = multer({ storage, fileFilter, limits });

module.exports = {
  uploadSingle: (fieldName) => baseUpload.single(fieldName),
  uploadArray: (fieldName, maxCount = 4) => baseUpload.array(fieldName, maxCount),

  // ⬇️ THIS IS REQUIRED FOR YOUR BANNER
  uploadFields: (fields) => baseUpload.fields(fields),

  baseUpload,
  uploadDir,
};
