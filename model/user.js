const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
  },
  role: {
    type: String,
    required: [true, "Role is required"],
    enum: ['admin', 'customer' , "driver" , "carrier" ,"broker" , "shipper"],
  },
  contact: {
    type: String,
    required: [true, "Contact is required"],
  },
  created_by: { 
    type: String,
    default: null,
  },
});

userSchema.index({ email: 1 }, { unique: [true, 'Unique email is required!' ]});

const User = mongoose.model('User', userSchema);

module.exports = User;