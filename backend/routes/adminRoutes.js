const express = require("express");

const {
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
} = require("../controllers/productController");

const upload = require("../middleware/upload");
const protectAdmin = require("../middleware/authMiddleware");

const router = express.Router();

// Every route below requires admin login
router.post(
  "/products",
  protectAdmin,
  upload.single("image"),
  createProduct
);

router.patch(
  "/products/:id",
  protectAdmin,
  upload.single("image"),
  updateProduct
);

router.delete(
  "/products/:id",
  protectAdmin,
  deleteProduct
);

router.patch(
  "/products/:id/stock",
  protectAdmin,
  updateStock
);

module.exports = router;