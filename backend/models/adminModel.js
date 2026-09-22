const mongoose = require("mongoose");
const validator = require("validator");

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Admin name is required"],
      trim: true,
    },

  email: {
  type: String,
  required: [true, "Admin email is required"],
  unique: true,
  lowercase: true,
  trim: true,
  validate: {
    validator: function (value) {
      return validator.isEmail(value);
    },
    message: "Please provide a valid email address",
  },
},

    password: {
      type: String,
      required: [true, "Admin password is required"],
    },

    role: {
      type: String,
      default: "admin",
    },

    resetPasswordToken: {
      type: String,
      default: null,
    },

    resetPasswordExpires: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Admin = mongoose.model("Admin", adminSchema);

module.exports = Admin;