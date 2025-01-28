const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  receiverShipperId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  receiverCustomerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  receiverBrokerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  receiverCarrierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  ShipmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Shipment",
    required: true,
  },
  isRead :{
    type :String ,
    default : false  
  },
}, { timestamps: true });


const NoficationModel = mongoose.model("notification", NotificationSchema);

module.exports = NoficationModel;