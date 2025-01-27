const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema({
    driver_id_ref: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Driver id reference is required"],
  },
  address: {
    type: String,
    required: [true, "Address is required"],
  },
  vin: {
    type: String,
    required: [true, "VIN number is required"],
  },
});

const Driver = mongoose.model("Driver", driverSchema);

module.exports = Driver;