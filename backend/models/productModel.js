const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },

    description: {
      type: String,
      required: [true, "Product description is required"],
      trim: true,
    },

    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Price cannot be negative"],
    },

    size: {
      type: String,
      required: [true, "Product size is required"],
      trim: true,
    },

    ml: {
      type: Number,
      required: [true, "Product millilitre is required"],
      min: [0, "Millilitre cannot be negative"],
    },

    category: {
      type: String,
      required: [true, "Product category is required"],
      enum: [
        "Perfume",
        "Body Spray",
        "Perfume Oil",
        "Lip Gloss",
        "Skincare",
        "Accessories",
      ],
      trim: true,
    },

    image: {
      type: String,
      required: [true, "Product image is required"],
    },

    stock: {
      type: Number,
      required: [true, "Product stock is required"],
      min: [0, "Stock cannot be negative"],
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model("Product", productSchema);

module.exports = Product;