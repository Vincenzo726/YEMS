const express = require("express");

const {
  createDeliveryArea,
  getDeliveryAreas,
  getDeliveryArea,
  updateDeliveryArea,
  deleteDeliveryArea,
} = require("../controllers/deliveryController");

const protectAdmin = require("../middleware/authMiddleware");

const router = express.Router();


// Admin creates delivery area
router.post(
  "/",
  protectAdmin,
  createDeliveryArea
);


// Customer/admin can view delivery areas
router.get(
  "/",
  getDeliveryAreas
);


// Get one delivery area
router.get(
  "/:id",
  getDeliveryArea
);


// Admin updates delivery area
router.patch(
  "/:id",
  protectAdmin,
  updateDeliveryArea
);


// Admin deletes delivery area
router.delete(
  "/:id",
  protectAdmin,
  deleteDeliveryArea
);


module.exports = router;