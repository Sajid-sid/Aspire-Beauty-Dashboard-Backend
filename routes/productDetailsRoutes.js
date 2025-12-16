const express = require("express");
const router = express.Router();
const {
  addOrUpdateDetails,
  getProductDetails,
} = require("../controllers/productDetailsController");

const { uploadSingle } = require("../middlewares/multerConfig");

// Add or Update Product Details
router.post("/", uploadSingle("description_image"), addOrUpdateDetails);

// Get Product Details by Product ID
router.get("/:productid", getProductDetails);

module.exports = router;
