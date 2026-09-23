const express = require("express");

const router = express.Router();

const {
  getProducts,
  getProductById,
} = require("../controllers/productController");


// =====================================================
// DISABLE PRODUCT API CACHING
// =====================================================

router.use((req, res, next) => {
  res.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );

  res.set(
    "Pragma",
    "no-cache"
  );

  res.set(
    "Expires",
    "0"
  );

  next();
});


// =====================================================
// PUBLIC PRODUCT ROUTES
// =====================================================

router.get(
  "/",
  getProducts
);

router.get(
  "/:id",
  getProductById
);


module.exports = router;