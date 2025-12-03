const express = require("express");
const router = express.Router();
const {
  login,
  register,
  resetPassword,
  forgotPassword,
  updateProfile
 
} = require("../controllers/userController.js");
const { uploadSingle } = require("../middlewares/multerConfig");
const authUser = require('../middlewares/authUser.js')
const { getAllUsers } = require("../controllers/userController");
const adminAuth = require('../middlewares/authAdmin.js')


router.get("/all", adminAuth, getAllUsers);
router.post("/register", uploadSingle("profile"), register);
router.put("/update-profile", authUser, uploadSingle("profile"), updateProfile);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);


module.exports = router;
