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
  shippingDate: {
    type: String,
    required: [true, "Shipping Date is required"],
  },
  deliveryDateExpect: {
    type: String,
    required: [true, "Delivery Date is required"],
  },
  cost: {
    type: Number,
    required: [true, "Delivery Date is required"],
  },
  paymentStatus: {
    type: String,
    required: [true, "Payment Status is required"],
  },
  quantity: {
    type: Number,
    required: [true, "Quantity is required"],
  },
  weight: {
    type: Number,
    required: [true, "Weight is required"],
  },
  dimensions: {
    type: String,
    required: [true, "Dimensions are required"],
  },
  typeOfGoods: {
    type: String,
    required: [true, "Type of goods is required"],
  },
  uploadedBol: {
    type: String,
    default: null
  },
  driverAccept: {
    type: String,
    default: null,
  },
  customer_sign: {
    type: String,
    default: null

  },
  driver_sign: {
    type: String,
    default: null
  },
  driver_location :{
    type: String,
    default: "transit",
  },
  review: {
    type: String,
    default: null
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Shipment", shipmentSchema);

// Fields created from frontend and backend in notepad
// name:title
// description:description
// pickup_location:pickup
// drop_location:delivery
// current_location:null
// customer_id: To be added
// status:Autofill null
// shipperid:autofill
// broker_id:brokerName
// carrier_id:null initially
// driver_id:initially


// shippingDate: shippingDate
// deliverydateexpect: deliveryDate
// cost: estimatedCost
// paymentStatus: paymentStatus
// typeOfGoods:typeOfGoods (Is required?)
// quantity: quantity
// weight:weight
// dimensions:dimensions
