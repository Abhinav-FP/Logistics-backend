const mongoose = require("mongoose");

const carrierSchema = new mongoose.Schema({
  carrier_id_given: {
    type: String,
    required: [true, "Carrier ID is required"],
  },
  career_id_ref: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Carrier id reference is required"],
  },
  type: {
    type: String,
    required: [true, "Carrier type is required"],
  },
  companyname: {
    type: String,
    required: [true, "Company name is required"],
  },
  license: {
    type: String,
    required: [true, "License number is required"],
  },
  size: {
    type: String,
    required: [true, "Fleet size is required"],
  },
  fax: {
    type: String,
    required: [true, "Fax is required"],
  },
  address: {
    type: String,
    required: [true, "Address is required"],
  },
  country: {
    type: String,
    required: [true, "Country is required"],
  },
  state: {
    type: String,
    required: [true, "State/Province is required"],
  },
  city: {
    type: String,
    required: [true, "City is required"],
  },
  postal: {
    type: String,
    required: [true, "Postal code is required"],
  },
});

const Carrier = mongoose.model("Carrier", carrierSchema);

module.exports = Carrier;
