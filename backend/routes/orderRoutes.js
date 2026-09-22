const express = require("express");

const {
  createOrder,
  initializePayment,
  verifyPayment,
  getOrders,
  getOrder,
  updateOrder,
} = require("../controllers/orderController");

const protectAdmin = require("../middleware/authMiddleware");

const router = express.Router();

/*
  CUSTOMER / PUBLIC ROUTES
*/

// Create an order
router.post("/", createOrder);

// Start Paystack payment
router.post("/initialize-payment", initializePayment);

// Paystack redirects here after payment
// This must remain PUBLIC because the customer is not logged into admin.
router.get("/verify-payment/:reference", verifyPayment);


/*
  ADMIN ORDER MANAGEMENT
*/

// View/search orders
router.get(
  "/",
  protectAdmin,
  getOrders
);

// View one specific order
router.get(
  "/:id",
  protectAdmin,
  getOrder
);

// Update order status
router.patch(
  "/:id",
  protectAdmin,
  updateOrder
);

module.exports = router;