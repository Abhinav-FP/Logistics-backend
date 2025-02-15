const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
  user_id_ref: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User id reference is required"],
  },
  address: {
    type: String,
    required: [true, "Address is required"],
  },
});

const Customer = mongoose.model("Customer", customerSchema);

module.exports = Customer;