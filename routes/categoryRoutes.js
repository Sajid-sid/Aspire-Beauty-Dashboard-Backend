const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const authAdmin = require("../middlewares/authAdmin");
const { uploadSingle } = require("../middlewares/multerConfig");

// ✅ Use uploadSingle("image") to handle image upload
router.post("/", authAdmin, uploadSingle("image"), categoryController.addCategory);

router.get("/", categoryController.getAllCategories);
router.get("/:id", categoryController.getCategory);
router.put("/:id", authAdmin, uploadSingle("image"), categoryController.updateCategory);

router.delete("/:id", authAdmin, categoryController.deleteCategory);

module.exports = router;
