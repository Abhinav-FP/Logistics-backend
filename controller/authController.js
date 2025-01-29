const User = require("../model/user");
const Carrier = require("../model/carrier");
const Customer = require("../model/customer");
const Driver = require("../model/driver");
const generator = require("generate-password");
const jwt = require("jsonwebtoken");
// const { v4: uuidv4 } = require('uuid');
const { validationErrorResponse, errorResponse, successResponse } = require("../utils/ErrorHandling");
const catchAsync = require("../utils/catchAsync");
const NotificationModel = require("../model/Notfication");

exports.signup = catchAsync(async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Check if required fields are provided
    if ((!email, !password, !role)) {
      return errorResponse(res, "All fields are required", 401, "false");
    }


    // Create new user record
    const record = new User({
      email,
      password,
      role,
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
        message: "Username and password are required",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return errorResponse(res, "User not found", 404, "false");
    }

    if (password != user.password) {
      return errorResponse(res, "Invalid username or password", 401);
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET_KEY,
      { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
    );

    return res.status(200).json({
      status: true,
      message: "Login successful",
      token,
      user: user,
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

    // Save remaining data to Carrier table with reference to User
    const driverRecord = new Driver({
      vin: vin,
      address: address,
      driver_id_ref: userResult._id,
    });

    const driverResult = await driverRecord.save();

    if (driverResult) {
      successResponse(res, "Customer created successfully!", 201, {
        user: userResult,
        customer: driverResult,
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

exports.getCarrier = catchAsync(async (req, res) => {
  try {
    const carriers = await Carrier.find().select("-password").populate("career_id_ref");
    if (!carriers) {
      return errorResponse(res, "No users found", 404);
    }
    return successResponse(res, "Users fetched successfully", 200, carriers);
  } catch (error) {
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

exports.getDriver = catchAsync(async (req, res) => {
  try {
    const drivers = await Driver.find().select("-password").populate("driver_id_ref");
    if (!drivers) {
      return errorResponse(res, "No data found", 404);
    }
    return successResponse(res, "Drivers fetched successfully", 200, drivers);
  } catch (error) {
    return errorResponse(res, error.message || "Internal Server Error", 500);
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
      return errorResponse(res, "User is not authorized or Token is missing", 401);
    }

    const userprofile = await User.findById(id).select('email role');
    if (!userprofile) {
      return errorResponse(res, "User profile not found", 404);
    }
    successResponse(res, "Profile retrieved successfully", 200, userprofile);
  } catch (error) {
    errorResponse(res, error.message || "Failed to fetch profile", 500);
  }
});


exports.createNotification = catchAsync(async (req, res) => {
  try {
    const { senderId, receiverShipperId, receiverCustomerId, receiverBrokerId, receiverCarrierId, ShipmentId } = req.body;
    const record = new NotificationModel({
      senderId,
      receiverShipperId,
      receiverCustomerId,
      receiverBrokerId,
      receiverCarrierId,
      ShipmentId,
    });
    const data = await record.save();
  } catch (error) {
    console.error(error);
    return errorResponse(res, error.message || "Internal Server Error");
  }
});



exports.updateNotification = catchAsync(async (req, res) => {
  try {
    const { senderId, receiverShipperId, receiverCustomerId, receiverBrokerId, receiverCarrierId, ShipmentId } = req.body;
    const updatedNotification = await NotificationModel.findOneAndUpdate(
      { ShipmentId },
      { senderId, receiverShipperId, receiverCustomerId, receiverBrokerId, receiverCarrierId, ShipmentId },
      { new: true, runValidators: true }
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});


exports.NotificationGet = catchAsync(async (req, res) => {
  const UserId = req.user.id;
  try {
    const query = {
      $or: [
        { receiverShipperId: UserId },
        { receiverCustomerId: UserId },
        { receiverBrokerId: UserId },
        { receiverCarrierId: UserId },
      ],
      isRead: false,
    };
    const notification = await NotificationModel.find(query).sort({ createdAt: -1 })
      .populate("ShipmentId")
      .populate("senderId", "-password")
      .populate("receiverShipperId", "-password")
      .populate("receiverCustomerId", "-password")
      .populate("receiverBrokerId", "-password")
      .populate("receiverCarrierId", "-password");
    const notificationCount = await NotificationModel.countDocuments(query);
    res.json({
      status: true,
      data: notification,
      count: notificationCount,
      message: 'Notifications fetched successfully',
    });
  } catch (error) {
    res.json({
      status: false,
      message: error.message || 'Failed to fetch notifications',
    });
  }
});


exports.MarkNotificationAsRead = catchAsync(async (req, res) => {
  const UserId = req.user.id;
  const { shipmentId } = req.body;
  if (!UserId || !shipmentId) {
    return res.status(400).json({
      status: false,
      message: 'UserId and ShipmentId are required',
    });
  }

  try {
    const result = await NotificationModel.findOneAndUpdate(
      { ShipmentId: shipmentId },
      { isRead: "true" },
      { new: true }
    );
    res.json({
      status: true,
      message: 'Notification marked as read successfully',
      notification: result,
    });
  } catch (error) {

    res.status(500).json({
      status: false,
      message: error.message || 'Failed to mark notification as read',
    });
  }
});




