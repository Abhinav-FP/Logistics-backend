const mongoose = require('mongoose');

const carrierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Carrier name is required"],
  },
  carrier_id: {
    type: String,
    required: [true, "Carrier ID is required"],
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
  information: {
    type: String,
    required: [true, "Contact information is required"],
  },
  phone: {
    type: String,
    required: [true, "Phone number is required"],
  },
  email: {
    type: String,
    required: [true, "Email address is required"],
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

const Carrier = mongoose.model('Carrier', carrierSchema);

module.exports = Carrier;
