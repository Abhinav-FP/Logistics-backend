const mongoose = require("mongoose");

const shipmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
  },
  description: {
    type: String,
    required: [true, "Description is required"],
  },
  pickup_location: {
    type: String,
    required: [true, "Pickup location is required"],
  },
  drop_location: {
    type: String,
    required: [true, "Drop location is required"],
  },
  current_location: {
    type: String,
    default: null,
  },
  customer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, "Customer id is required"],
  },
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'transit', 'delivered'],
  },
  shipper_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, "Shipper id is required"],
  },
  broker_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, "Broker id is required"],
  },
  carrier_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  driver_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Shipment", shipmentSchema);