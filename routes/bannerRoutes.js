// routes/bannerRoutes.js
const express = require("express");
const router = express.Router();
const bannerController = require("../controllers/bannerController");
const { uploadFields } = require("../middlewares/multerConfig");

router.post(
  "/add",
  uploadFields([
    { name: "home1", maxCount: 1 },
    { name: "home2", maxCount: 1 },
    { name: "home3", maxCount: 1 },
    { name: "mobile1", maxCount: 1 },
    { name: "mobile2", maxCount: 1 },
    { name: "mobile3", maxCount: 1 },
    { name: "middle1", maxCount: 1 },
    { name: "middle2", maxCount: 1 },
  ]),
  bannerController.addBanner
);

router.put(
  "/edit",
  uploadFields([
    { name: "home1", maxCount: 1 },
    { name: "home2", maxCount: 1 },
    { name: "home3", maxCount: 1 },
    { name: "mobile1", maxCount: 1 },
    { name: "mobile2", maxCount: 1 },
    { name: "mobile3", maxCount: 1 },
    { name: "middle1", maxCount: 1 },
    { name: "middle2", maxCount: 1 },
  ]),
  bannerController.editBanner
);

router.get("/", bannerController.getBanner);

module.exports = router;
