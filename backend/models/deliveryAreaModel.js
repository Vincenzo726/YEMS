const mongoose = require("mongoose");

const deliveryAreaSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    fee: {
      type: Number,
      required: true,
      min: 0,
    },

    // Location selected by the admin
    latitude: {
      type: Number,
      required: true,
    },

    longitude: {
      type: Number,
      required: true,
    },

    // How far from this point YEMS will deliver
    radiusKm: {
      type: Number,
      required: true,
      min: 0.1,
    },

    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const DeliveryArea = mongoose.model(
  "DeliveryArea",
  deliveryAreaSchema
);

module.exports = DeliveryArea;