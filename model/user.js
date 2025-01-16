const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  uuid: {
    type: String,
    required: [true, "UUID is required"],
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
    required: [true, "Role is requireddfd"],
  },
});

userSchema.index({ email: 1 }, { unique: [true, 'Unique email is required!' ]});

const User = mongoose.model('User', userSchema);

module.exports = User;