const User = require("../model/user");
const generator = require("generate-password");
const jwt = require("jsonwebtoken");
// const { v4: uuidv4 } = require('uuid');
const {validationErrorResponse,errorResponse,  successResponse} = require("../utils/ErrorHandling");
const catchAsync = require("../utils/catchAsync");

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
      created_by:null,
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

exports.createAccount = catchAsync(async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!email || !role) {
      return errorResponse(res, "All fields are required", 500, false);
    }
    const password = generator.generate({
      length: 10,
      numbers: true,
    });

    
    const record = new User({
      email,
      password,
      role,
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
      return errorResponse(res, "User is not authorized or Token is missing", 401);
    }

    const userprofile = await User.findById(id).select('email role');
    if (!userprofile) {
      return errorResponse(res, "User profile not found", 404);
    }
    successResponse(res,"Profile retrieved successfully",200,userprofile);
  } catch (error) {
    errorResponse(res, error.message || "Failed to fetch profile", 500);
  }
});