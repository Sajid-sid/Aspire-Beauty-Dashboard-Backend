const express = require("express");
const router = express.Router();
const orderController = require('../controllers/orderController');
const authAdmin = require("../middlewares/authAdmin");


router.post("/", orderController.placeOrder);                               
router.get("/", orderController.getAllOrders);                  
router.get("/:id", orderController.getOrderById);                         
router.put("/status/:id", authAdmin, orderController.updateOrderStatus);   
router.get("/user/:id", orderController.getOrdersByUserId); 
router.put("/item-status/:itemId", authAdmin, orderController.updateOrderItemStatus);


module.exports = router;
