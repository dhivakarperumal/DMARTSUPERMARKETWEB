const express = require("express");
const { getAllOrders, createOrder, getUserOrders, getOrderById, updateOrderStatus } = require("../controllers/ordersController");

const router = express.Router();

router.get("/", getAllOrders);
router.get("/user/:user_id", getUserOrders);
router.post("/", createOrder);
router.get("/:id", getOrderById);
router.put("/:id/status", updateOrderStatus);

module.exports = router;
