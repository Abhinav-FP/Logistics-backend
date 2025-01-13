
const User = require('../model/user');
const Role = require('../model/role');
const { validationErrorResponse, errorResponse, successResponse } = require("../utils/ErrorHandling");
const catchAsync = require("../utils/catchAsync");

const jwt = require('jsonwebtoken'); 


exports.signup = catchAsync(async (req, res) => {
    try {
      const {
        email,
        password,
        role,
      } = req.body;
  
      // Check if required fields are provided
      if ( !email, !password, !role ) {
        return res.status(401).json({
          status: false,
          message: 'All fields are required',
        });
      }  
  
  
      // Create new user record
      const record = new User({
          email,
          password,
          role,
      });
  
     const result = await record.save();
     if (result) {
        successResponse(res, "You have been registered successfully !!", 201);
      } else {
      errorResponse("Failed to create user.", 500);
    } 
    }catch (error) {
      return errorResponse(res, error.message || "Internal Server Error", 500);
    }
  });

exports.login = catchAsync(async (req, res) => {
    try {
      const { email, password } = req.body;
  
      if (!email || !password) {
        return res.status(401).json({
          status: false,
          message: 'Username and password are required',
        });
      }
  
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({
          status: false,
          message: 'User not found',
        });
      }
  
      if(password != user.password){
        return res.status(401).json({
          status: false,
          message: 'Invalid username or password',
        });
      }
  
      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET_KEY, 
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' } 
      );
  
      return res.status(200).json({
        status: true,
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          username: user.username,
          role: user.role,
        },
      });
    } catch (error) {
      return errorResponse(res, error.message || "Internal Server Error", 500);
    }
  });

  exports.check = catchAsync(async (req, res) => {
    try {
    successResponse(res, "Successfully hit the route!", 201);      
    } catch (error) {
      return errorResponse(res, error.message || "Internal Server Error", 500);
    }
  });