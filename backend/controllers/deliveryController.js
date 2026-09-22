const DeliveryArea = require("../models/deliveryAreaModel");


// =====================================================
// CREATE DELIVERY AREA
// =====================================================

const createDeliveryArea = async (req, res) => {
  try {
    const {
      name,
      fee,
      latitude,
      longitude,
      radiusKm,
      active = true,
    } = req.body;

    if (
      !name ||
      fee === undefined ||
      latitude === undefined ||
      longitude === undefined ||
      radiusKm === undefined
    ) {
      return res.status(400).json({
        status: "fail",
        message: "Please provide all delivery area details",
      });
    }

    const deliveryArea = await DeliveryArea.create({
      name,
      fee: Number(fee),
      latitude: Number(latitude),
      longitude: Number(longitude),
      radiusKm: Number(radiusKm),
      active: Boolean(active),
    });

    res.status(201).json({
      status: "success",
      message: "Delivery area created successfully",
      data: {
        deliveryArea,
      },
    });
  } catch (error) {
    console.error("Create delivery area error:", error);

    res.status(500).json({
      status: "fail",
      message: "Failed to create delivery area",
      error: error.message,
    });
  }
};


// =====================================================
// GET ALL DELIVERY AREAS
// =====================================================

const getDeliveryAreas = async (req, res) => {
  try {
    const deliveryAreas = await DeliveryArea.find()
      .sort({ name: 1 });

    res.status(200).json({
      status: "success",
      results: deliveryAreas.length,
      data: {
        deliveryAreas,
      },
    });
  } catch (error) {
    console.error("Get delivery areas error:", error);

    res.status(500).json({
      status: "fail",
      message: "Failed to fetch delivery areas",
      error: error.message,
    });
  }
};


// =====================================================
// GET ONE DELIVERY AREA
// =====================================================

const getDeliveryArea = async (req, res) => {
  try {
    const deliveryArea = await DeliveryArea.findById(
      req.params.id
    );

    if (!deliveryArea) {
      return res.status(404).json({
        status: "fail",
        message: "Delivery area not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        deliveryArea,
      },
    });
  } catch (error) {
    console.error("Get delivery area error:", error);

    res.status(500).json({
      status: "fail",
      message: "Failed to fetch delivery area",
      error: error.message,
    });
  }
};


// =====================================================
// UPDATE DELIVERY AREA
// =====================================================

const updateDeliveryArea = async (req, res) => {
  try {
    const {
      name,
      fee,
      latitude,
      longitude,
      radiusKm,
      active,
    } = req.body;

    const updateFields = {};

    if (name !== undefined) {
      updateFields.name = name;
    }

    if (fee !== undefined) {
      updateFields.fee = Number(fee);
    }

    if (latitude !== undefined) {
      updateFields.latitude = Number(latitude);
    }

    if (longitude !== undefined) {
      updateFields.longitude = Number(longitude);
    }

    if (radiusKm !== undefined) {
      updateFields.radiusKm = Number(radiusKm);
    }

    if (active !== undefined) {
      updateFields.active = Boolean(active);
    }

    if (!Object.keys(updateFields).length) {
      return res.status(400).json({
        status: "fail",
        message: "Nothing to update",
      });
    }

    const deliveryArea =
      await DeliveryArea.findByIdAndUpdate(
        req.params.id,
        updateFields,
        {
          new: true,
          runValidators: true,
        }
      );

    if (!deliveryArea) {
      return res.status(404).json({
        status: "fail",
        message: "Delivery area not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Delivery area updated successfully",
      data: {
        deliveryArea,
      },
    });
  } catch (error) {
    console.error("Update delivery area error:", error);

    res.status(400).json({
      status: "fail",
      message: "Failed to update delivery area",
      error: error.message,
    });
  }
};


// =====================================================
// DELETE DELIVERY AREA
// =====================================================

const deleteDeliveryArea = async (req, res) => {
  try {
    const deliveryArea =
      await DeliveryArea.findByIdAndDelete(
        req.params.id
      );

    if (!deliveryArea) {
      return res.status(404).json({
        status: "fail",
        message: "Delivery area not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Delivery area deleted successfully",
    });
  } catch (error) {
    console.error("Delete delivery area error:", error);

    res.status(500).json({
      status: "fail",
      message: "Failed to delete delivery area",
      error: error.message,
    });
  }
};


// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  createDeliveryArea,
  getDeliveryAreas,
  getDeliveryArea,
  updateDeliveryArea,
  deleteDeliveryArea,
};