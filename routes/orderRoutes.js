const express = require("express");
const router = express.Router();
const orderController = require('../controllers/orderController');
const authAdmin = require("../middlewares/authAdmin");


router.post("/", orderController.placeOrder);                               //create order
router.get("/", orderController.getAllOrders);                  //get all orders
router.get("/:id", orderController.getOrderById);                         // GET ORDER BY ID
router.put("/status/:id", authAdmin, orderController.updateOrderStatus);   //update order status
router.get("/user/:id", orderController.getOrdersByUserId); //get all orders by user id

module.exports = router;
