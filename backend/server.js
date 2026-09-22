require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const connectDB = require("./config/db");

const productRoutes = require("./routes/productRoutes");
const adminRoutes = require("./routes/adminRoutes");
const orderRoutes = require("./routes/orderRoutes");
const authRoutes = require("./routes/authRoutes");
const deliveryRoutes = require("./routes/deliveryRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend files
app.use(express.static(path.join(__dirname, "../public")));

// Serve uploaded images
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

// API routes

app.use("/products", productRoutes);
app.use("/admin", adminRoutes);
app.use("/orders", orderRoutes);
app.use("/auth", authRoutes);
app.use("/delivery-areas", deliveryRoutes);

// Homepage
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Admin dashboard
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/admin.html"));
});

// Test route
app.get("/test-auth", (req, res) => {
  res.json({
    success: true,
    message: "Auth route connection is working",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.listen(PORT, () => {
  console.log(`YEMS server running on http://localhost:${PORT}`);
});