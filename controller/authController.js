const User = require("../model/user");
const Carrier = require("../model/carrier");
const Customer = require("../model/customer");
const Driver = require("../model/driver");
const generator = require("generate-password");
const jwt = require("jsonwebtoken");
const { validationErrorResponse, errorResponse, successResponse } = require("../utils/ErrorHandling");
const catchAsync = require("../utils/catchAsync");
const NotificationModel = require("../model/Notification");
const shipment = require("../model/shipment");
const Otp = require("../Email/Otp");
const nodemailer = require('nodemailer');

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










// Notification System Management 

exports.createNotification = catchAsync(async (req, res) => {
  try {
    const { senderId, receiverShipperId, receiverCustomerId, receiverBrokerId, receiverCarrierId, ShipmentId } = req.body;
    const record = new NotificationModel({
      senderId,
      receiverShipperId,
      receiverCustomerId: receiverCustomerId.map(obj => ({ Receiver: obj.Receiver })),
      receiverBrokerId: receiverBrokerId.map(obj => ({ Receiver: obj.Receiver })),
      receiverCarrierId,
      ShipmentId,
    });
    const data = await record.save();


  } catch (error) {
    console.error(error);

  }
});
exports.updateNotification = catchAsync(async (req, res) => {
  try {
    const { senderId, receiverShipperId, receiverCustomerId, receiverBrokerId, receiverCarrierId, ShipmentId, receiverDriverId } = req.body;

    const formatToArray = (value) => (Array.isArray(value) ? value : [{ Receiver: value }]);

    const updatedNotification = await NotificationModel.findOneAndUpdate(
      { ShipmentId },
      {
        senderId,
        receiverShipperId,
        receiverCustomerId: formatToArray(receiverCustomerId),
        receiverBrokerId: formatToArray(receiverBrokerId),
        receiverCarrierId: formatToArray(receiverCarrierId),
        receiverDriverId: formatToArray(receiverDriverId),

        ShipmentId,
      },
      { new: true, runValidators: true }
    );

  } catch (error) {
    console.error(error);
  }
});

exports.NotificationGet = catchAsync(async (req, res) => {
  const UserId = req.user.id;
  try {
    const query = {
      $and: [
        {
          $or: [
            { "receiverShipperId.Receiver": UserId },
            { "receiverCustomerId.Receiver": UserId },
            { "receiverBrokerId.Receiver": UserId },
            { "receiverCarrierId.Receiver": UserId }
          ]
        },
        {
          $or: [
            { "receiverShipperId.IsRead": false, "receiverShipperId.Receiver": UserId },
            { "receiverCustomerId.IsRead": false, "receiverCustomerId.Receiver": UserId },
            { "receiverBrokerId.IsRead": false, "receiverBrokerId.Receiver": UserId },
            { "receiverCarrierId.IsRead": false, "receiverCarrierId.Receiver": UserId }
          ]
        }
      ]
    };

    const notification = await NotificationModel.find(query).sort({ createdAt: -1 })
      .populate("ShipmentId")
      .populate("senderId", "-password")
      .populate("receiverShipperId.Receiver", "-password")
      .populate("receiverCustomerId.Receiver", "-password")
      .populate("receiverBrokerId.Receiver", "-password")
      .populate("receiverCarrierId.Receiver", "-password");


    const notificationCount = notification.length;

    res.json({
      status: true,
      data: notification,
      count: notificationCount,
      message: 'Notifications fetched successfully',
    });
  } catch (error) {
    console.error("Error:", error);
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
    const notification = await NotificationModel.findOne({ ShipmentId: shipmentId });

    if (!notification) {
      return res.status(404).json({
        status: false,
        message: 'Notification not found',
      });
    }

    let updated = false;

    notification.receiverShipperId.forEach(receiver => {
      if (receiver.Receiver && receiver.Receiver.equals(UserId)) {
        receiver.IsRead = true;
        updated = true;
      }
    });

    notification.receiverCustomerId.forEach(receiver => {
      if (receiver.Receiver && receiver.Receiver.equals(UserId)) {
        receiver.IsRead = true;
        updated = true;
      }
    });

    notification.receiverBrokerId.forEach(receiver => {
      if (receiver.Receiver && receiver.Receiver.equals(UserId)) {
        receiver.IsRead = true;
        updated = true;
      }
    });

    notification.receiverCarrierId.forEach(receiver => {
      if (receiver.Receiver && receiver.Receiver.equals(UserId)) {
        receiver.IsRead = true;
        updated = true;
      }
    });

    if (!updated) {
      return res.status(404).json({
        status: false,
        message: 'UserId not found in any receivers',
      });
    }

    const result = await notification.save();

    res.json({
      status: true,
      message: 'Notification marked as read successfully',
      notification: result,
    });
  } catch (error) {
    console.error("Error occurred:", error);
    res.status(500).json({
      status: false,
      message: error.message || 'Failed to mark notification as read',
    });
  }
});



// DashboardApi 


exports.DashboardApi = catchAsync(async (req, res) => {
  try {
    const Users = await User.countDocuments({});
    const Shipment = await shipment.countDocuments({});
    const PendingShipment = await shipment.find({ status: "pending" }).countDocuments();
    const transitShipment = await shipment.find({ status: "transit" }).countDocuments();
    const deliveredShipment = await shipment.find({ status: "delivered" }).countDocuments();
    const PayOnDeliveryShipment = await shipment.find({ paymentStatus: "PayOnDelivery" }).countDocuments();
    const DonePayShipment = await shipment.find({ paymentStatus: "Done" }).countDocuments();
    const ShimentData = await shipment.find({}).limit(5);
    res.json({
      status: true,
      message: "Dashboard fetched successfully",
      Users,
      Shipment,
      PendingShipment,
      deliveredShipment,
      transitShipment,
      PayOnDeliveryShipment,
      DonePayShipment,
      ShimentData
    })
  } catch (error) {
    console.error("Error occurred:", error);
    errorResponse(res, error.message || "Failed to fetch profile", 500);
  }
})


// Forget Password 

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000); // Generates a 6-digit OTP
}


exports.forgotlinkrecord = catchAsync(async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return validationErrorResponse(res, { email: 'Email is required' });
    }
    const record = await User.findOne({ email: email });
    if (!record) {
      return errorResponse(res, "No user found with this email", 404);
    }
    const customerUser = record.name;
    const OTP = generateOTP();
    let transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    const emailHtml = Otp(OTP, customerUser);


    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: record.email,
      OTP: OTP,
      subject: "Reset Your Password",
      html: emailHtml,
    });

    record.Otp = OTP
    await record.save();
    return successResponse(res, "Email has been sent to your registered email");

  } catch (error) {
    console.error("Error in forgot password process:", error);
    // logger.error("Error in forgot password process:", error);
    return errorResponse(res, "Failed to send email");
  }
}
);

exports.forgotpassword = catchAsync(async (req, res) => {
  try {
    const { Otp, newPassword } = req.body;
    const user = await User.findOne({ Otp: Otp });
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }
    user.password = newPassword
    await user.save();
    return successResponse(res, "Password has been successfully reset");
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, "Token has expired. Please generate a new token.", 401);
    }
    console.error("Error in password reset process:", error);
    return errorResponse(res, "Failed to reset password");
  }
}
);
