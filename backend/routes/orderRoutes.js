const express = require("express");

const {
  createOrder,
  initializePayment,
  verifyPayment,
  getOrders,
  getOrder,
  updateOrder,
} = require("../controllers/orderController");

const router = express.Router();

router.post("/", createOrder);

router.post("/initialize-payment", initializePayment);

router.get("/verify-payment/:reference", verifyPayment);

router.get("/", getOrders);

router.get("/:id", getOrder);

router.patch("/:id", updateOrder);

module.exports = router;