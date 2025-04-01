const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  SenderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  ReciverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  text: String,
  IsRead: {
    type: Boolean,
    default: false,
  },
  ShipmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Shipment",
    required: true,
  },
}, { timestamps: true });

const NotificationModel = mongoose.model("Notification", NotificationSchema);

module.exports = NotificationModel;
