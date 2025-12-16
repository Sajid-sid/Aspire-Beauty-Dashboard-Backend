const express = require("express");
const router = express.Router();
const stockController = require("../controllers/stockController");

router.put("/add/:id", stockController.addStock);

module.exports = router;
