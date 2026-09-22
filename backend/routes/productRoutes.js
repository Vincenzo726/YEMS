const express = require("express");

const router = express.Router();

const {
  getProducts,
  getProductById,
} = require("../controllers/productController");

// Public route: get all products
router.get("/", getProducts);

// Public route: get one product by ID
router.get("/:id", getProductById);

module.exports = router;