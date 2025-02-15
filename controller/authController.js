const User = require("../model/user");
const mongoose = require("mongoose");
const Carrier = require("../model/carrier");
const Customer = require("../model/customer");
const Driver = require("../model/driver");
const generator = require("generate-password");
const jwt = require("jsonwebtoken");
const { errorResponse, successResponse } = require("../utils/ErrorHandling");
const catchAsync = require("../utils/catchAsync");
const shipment = require("../model/shipment");

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhoneNumber = (phoneNumber) => {
  const phoneNumberRegex = /^[0-9]{10}$/; // Assumes a 10-digit phone number
  return phoneNumberRegex.test(phoneNumber);
};

exports.signup = catchAsync(async (req, res) => {
  try {
    const { name, email, password, role, contact } = req.body;

    // Check if required fields are provided
    if ((!email, !password, !role)) {
      return errorResponse(res, "All fields are required", 401, "false");
    }

    // Create new user record
    const record = new User({
      name,
      email,
      password,
      role,
      contact,
      created_by: null,
    });

    const result = await record.save();
    if (result) {
      successResponse(res, "You have been registered successfully !!", 201);
    } else {
      errorResponse(res, "Failed to create user.", 500);
    }
  } catch (error) {
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

exports.login = catchAsync(async (req, res) => {
  // Code to sync indexes
  // User.syncIndexes()
  // .then(() => {
  //   console.log('Indexes synced successfully');
  // })
  // .catch((err) => {
  //   console.error('Error syncing indexes:', err.message);
  // });

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(401).json({
        status: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return errorResponse(res, "Invalid email", 401);
    }
    if (user?.role === "driver") {
      return errorResponse(
        res,
        "Drivers are not allowed to login on website",
        401,
        "false"
      );
    }

    if (password != user.password) {
      return errorResponse(res, "Invalid password", 401);
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET_KEY,
      { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
    );

    const userObject = user.toObject();
    delete userObject.password;
    return res.status(200).json({
      status: true,
      message: "Login successful",
      token,
      user: userObject,
    });
  } catch (error) {
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

exports.resetPassword = catchAsync(async (req, res) => {
  try {
    const { password, newpassword } = req.body;

    if (!newpassword || !password) {
      return res.status(400).json({
        status: false,
        message: "Both current and new passwords are required",
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return errorResponse(res, "User not found", 404, false);
    }

    if (user.password !== password) {
      return res.status(401).json({
        status: false,
        message: "Current password is incorrect",
      });
    }

    user.password = newpassword;
    await user.save();

    return res.status(200).json({
      status: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

exports.createAccount = catchAsync(async (req, res) => {
  try {
    const { name, email, role, contact } = req.body;

    if (!email || !role || !name || !contact) {
      return errorResponse(res, "All fields are required", 500, false);
    }

    if (!validateEmail(email)) {
      return errorResponse(res, "Invalid email address", 500, false);
    }

    if (!validatePhoneNumber(contact)) {
      return errorResponse(res, "Invalid phone number", 500, false);
    }
    const password = generator.generate({
      length: 10,
      numbers: true,
    });

    const record = new User({
      name,
      email,
      password,
      role,
      contact,
      created_by: req.user.id,
    });

    const result = await record.save();
    if (result) {
      successResponse(res, "User created successfully !!", 201, result);
    } else {
      errorResponse(res, "Failed to create user.", 500);
    }
  } catch (error) {
    if (error.code === 11000) {
      return errorResponse(res, "Email already exists.", 400);
    }
    errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

exports.getUsers = catchAsync(async (req, res) => {
  try {
    const { type } = req.params;

    const query = type ? { role: type } : {};

    const users = await User.find(query).select("-password");

    if (!users) {
      return errorResponse(res, "No users found", 404);
    }
    return successResponse(res, "Users fetched successfully", 200, users);
  } catch (error) {
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

exports.profilegettoken = catchAsync(async (req, res, next) => {
  try {
    const id = req?.user?.id;
    if (!id) {
      return errorResponse(
        res,
        "User is not authorized or Token is missing",
        401
      );
    }

    const userprofile = await User.findById(id).select("email role");
    if (!userprofile) {
      return errorResponse(res, "User profile not found", 404);
    }
    successResponse(res, "Profile retrieved successfully", 200, userprofile);
  } catch (error) {
    errorResponse(res, error.message || "Failed to fetch profile", 500);
  }
});



// Carrier Panel
exports.createCarrier = catchAsync(async (req, res) => {
  try {
    const { name, email, role, contact } = req.body;

    // Validate required fields
    if (!email || !role || !name || !contact) {
      return errorResponse(res, "All fields are required", 500, false);
    }
    // Generate password
    const password = generator.generate({
      length: 10,
      numbers: true,
    });

    // Save user data to User table
    const userRecord = new User({
      name,
      email,
      password,
      role,
      contact,
      created_by: req.user.id,
    });

    const userResult = await userRecord.save();

    if (!userResult) {
      return errorResponse(res, "Failed to create user.", 500);
    }

    // Save remaining data to Carrier table with reference to User
    const carrierRecord = new Carrier({
      carrier_id_given: req.body.id,
      type: req.body.type,
      companyname: req.body.companyname,
      license: req.body.license,
      size: req.body.size,
      fax: req.body.fax,
      address: req.body.address,
      country: req.body.country,
      state: req.body.state,
      city: req.body.city,
      postal: req.body.postal,
      career_id_ref: userResult._id,
    });

    const carrierResult = await carrierRecord.save();

    if (carrierResult) {
      successResponse(res, "Carrier created successfully!", 201, {
        user: userResult,
        carrier: carrierResult,
      });
    } else {
      // Rollback user creation if carrier creatison fails
      await User.findByIdAndDelete(userResult._id);
      errorResponse(res, "Failed to create carrier.", 500);
    }
  } catch (error) {
    if (error.code === 11000) {
      return errorResponse(res, "Email already exists.", 400);
    }
    errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

exports.getCarrier = catchAsync(async (req, res) => {
  try {
    const carriers = await Carrier.find()
      .select("-password")
      .populate("career_id_ref");
    if (!carriers) {
      return errorResponse(res, "No users found", 404);
    }
    return successResponse(res, "Users fetched successfully", 200, carriers);
  } catch (error) {
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

// Customer Panel
exports.createCustomer = catchAsync(async (req, res) => {
  try {
    const { name, email, role, contact, address } = req.body;

    // Validate required fields
    if (!email || !role || !name || !contact || !address) {
      return errorResponse(res, "All fields are required", 500, false);
    }

    // Generate password
    const password = generator.generate({
      length: 10,
      numbers: true,
    });

    // Save user data to User table
    const userRecord = new User({
      name,
      email,
      password,
      role,
      contact,
      created_by: req.user.id,
    });

    const userResult = await userRecord.save();

    if (!userResult) {
      return errorResponse(res, "Failed to create user.", 500);
    }

    // Save remaining data to Carrier table with reference to User
    const customerRecord = new Customer({
      address: address,
      user_id_ref: userResult._id,
    });

    const customerResult = await customerRecord.save();

    if (customerResult) {
      successResponse(res, "Customer created successfully!", 201, {
        user: userResult,
        customer: customerResult,
      });
    } else {
      // Rollback user creation if carrier creatison fails
      await User.findByIdAndDelete(userResult._id);
      errorResponse(res, "Failed to create customer.", 500);
    }
  } catch (error) {
    if (error.code === 11000) {
      return errorResponse(res, "Email already exists.", 400);
    }
    errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

exports.GetCoustomer = catchAsync(async (req, res) => {
  try {
    const users = await Customer.find().populate(
      "user_id_ref",
      "-password -__v -created_at -updated_at"
    );
    if (!users) {
      return errorResponse(res, "No users found", 404);
    }
    return successResponse(res, "Users fetched successfully", 200, users);
  } catch (error) {
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

// ?Driver
exports.createDriver = catchAsync(async (req, res) => {
  try {
    const { name, email, role, contact, address, vin } = req.body;

    // Validate required fields
    if (!email || !role || !name || !contact || !address || !vin) {
      return errorResponse(res, "All fields are required", 500, false);
    }

    const password = generator.generate({
      length: 10,
      numbers: true,
    });

    // Save user data to User table
    const userRecord = new User({
      name,
      email,
      password,
      role,
      contact,
      created_by: req.user.id,
    });

    const userResult = await userRecord.save();

    if (!userResult) {
      return errorResponse(res, "Failed to create user.", 500);
    }

    const driverRecord = new Driver({
      vin: vin,
      address: address,
      driver_id_ref: userResult._id,
    });

    const driverResult = await driverRecord.save();

    if (driverResult) {
      successResponse(res, "Driver created successfully!", 201, {
        user: userResult,
        customer: driverResult,
      });
    } else {
      // Rollback user creation if carrier creatison fails
      await User.findByIdAndDelete(userResult._id);
      errorResponse(res, "Failed to create driver.", 500);
    }
  } catch (error) {
    if (error.code === 11000) {
      return errorResponse(res, "Email already exists.", 400);
    }
    errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

exports.getDriver = catchAsync(async (req, res) => {
  try {
    // const drivers = await Driver.find().populate("driver_id_ref");
    const drivers = await Driver.find().populate(
      "driver_id_ref",
      "-password -__v -created_at -updated_at"
    );
    if (!drivers) {
      return errorResponse(res, "No data found", 404);
    }
    return successResponse(res, "Drivers fetched successfully", 200, drivers);
  } catch (error) {
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});
