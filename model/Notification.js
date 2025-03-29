const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  receiverShipperId: [{
    Receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    IsRead: {
      type: Boolean,
      default: false,
    },
  }],
  receiverCustomerId: [{
    Receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    IsRead: {
      type: Boolean,
      default: false,
    },
  }],
  receiverBrokerId: [{
    Receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    IsRead: {
      type: Boolean,
      default: false,
    },
  }],
  receiverCarrierId: [{
    Receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    IsRead: {
      type: Boolean,
      default: false,
    },
  }],
  receiverDriverId: [{
    Receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    IsRead: {
      type: Boolean,
      default: false,
    },
  }],
  ShipmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Shipment",
    required: true,
  },
  Text: String,
}, { timestamps: true });

const NotificationModel = mongoose.model("Notification", NotificationSchema);

module.exports = NotificationModel;
