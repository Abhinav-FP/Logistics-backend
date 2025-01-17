const Shipment = require("../model/shipment");
const { validationErrorResponse, errorResponse, successResponse } = require("../utils/ErrorHandling");
const catchAsync = require("../utils/catchAsync");

exports.createShipment = catchAsync(async (req, res) => {
  try {
    const {
      name,
      description,
      pickup_location,
      drop_location,
      customer_id,
      status,
      shipper_id,
      broker_id,
    } = req.body;

    // Validate required fields
    if (!name || !description || !pickup_location || !drop_location || !customer_id || !shipper_id || !broker_id) {
      return errorResponse(res, "All required fields must be provided", 400, false);
    }

    // Create a new shipment document
    const shipment = await Shipment.create({
      name,
      description,
      pickup_location,
      drop_location,
      customer_id,
      status: status || "pending",
      shipper_id,
      broker_id,
    });

    // Respond with success
    return successResponse(res, "Shipment created successfully", 201, shipment);
  } catch (error) {
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

exports.updateShipment = catchAsync(async (req, res) => {
  try {
    const updateData = req.body;

    if (!updateData || Object.keys(updateData).length === 0) {
      return errorResponse(res, "No data provided to update", 400, false);
    }

    const shipment = await Shipment.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!shipment) {
      return errorResponse(res, "Shipment not found", 404, false);
    }

    return successResponse(res, "Shipment updated successfully", 200, shipment);
  } catch (error) {
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});