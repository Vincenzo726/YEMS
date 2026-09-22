const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    size: {
      type: String,
      trim: true,
    },

    ml: {
      type: Number,
      min: 0,
    },

    image: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    // =========================================
    // ORDER REFERENCE
    // =========================================
    orderReference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // =========================================
    // CUSTOMER INFORMATION
    // =========================================
    customer: {
      fullName: {
        type: String,
        required: true,
        trim: true,
      },

      email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
      },

      phone: {
        type: String,
        required: true,
        trim: true,
      },

      address: {
        type: String,
        required: true,
        trim: true,
      },

      city: {
        type: String,
        required: true,
        trim: true,
      },

      state: {
        type: String,
        required: true,
        trim: true,
      },

      additionalNote: {
        type: String,
        trim: true,
        default: "",
      },
    },

    // =========================================
    // DELIVERY METHOD
    // =========================================
    deliveryMethod: {
      type: String,
      enum: ["delivery", "pickup"],
      required: true,
      default: "delivery",
    },

    // =========================================
    // DELIVERY AREA
    // =========================================
    deliveryArea: {
      areaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DeliveryArea",
        default: null,
      },

      name: {
        type: String,
        trim: true,
        default: "",
      },
    },

    // =========================================
    // CUSTOMER DESTINATION COORDINATES
    // =========================================
    deliveryLocation: {
      latitude: {
        type: Number,
        default: null,
      },

      longitude: {
        type: Number,
        default: null,
      },

      formattedAddress: {
        type: String,
        trim: true,
        default: "",
      },
    },

    // =========================================
    // ORDER ITEMS
    // =========================================
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: function (items) {
          return items.length > 0;
        },
        message: "Order must contain at least one item.",
      },
    },

    // =========================================
    // MONEY
    // =========================================
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    deliveryFee: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    total: {
      type: Number,
      required: true,
      min: 0,
    },

    // =========================================
    // PAYMENT
    // =========================================
    paymentMethod: {
      type: String,
      enum: ["paystack"],
      required: true,
      default: "paystack",
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      required: true,
      default: "pending",
    },

    paystackReference: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },

    paidAt: {
      type: Date,
      default: null,
    },

    // =========================================
    // ORDER STATUS
    // =========================================
    orderStatus: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      required: true,
      default: "pending",
    },
  },

  {
    timestamps: true,
  }
);

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;