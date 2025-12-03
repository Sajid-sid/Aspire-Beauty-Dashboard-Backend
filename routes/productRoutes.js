const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const authAdmin = require("../middlewares/authAdmin");
const { uploadFields } = require("../middlewares/multerConfig"); // import if you had it

// Since you commented out uploadFields, we can manually use multer.fields here:
const multer = require("multer");
const { baseUpload } = require("../middlewares/multerConfig");

const productImageUpload = baseUpload.fields([
  { name: "image1", maxCount: 1 },
  { name: "image2", maxCount: 1 },
  { name: "image3", maxCount: 1 },
  { name: "image4", maxCount: 1 },
]);

// ✅ Public routes
router.get("/", productController.getAllProducts);
router.get("/:id", productController.getProductById);

// ✅ Admin routes
router.post("/", authAdmin, productImageUpload, productController.addProduct);
router.put("/:id", authAdmin, productImageUpload, productController.updateProduct);
router.delete("/delete/:id", authAdmin, productController.deleteProduct);

module.exports = router;
