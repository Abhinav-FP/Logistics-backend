const Driver = require("../model/driver");
const shipment = require("../model/shipment");
const User = require("../model/user");
const catchAsync = require("../utils/catchAsync");
const jwt = require("jsonwebtoken");
const { ApperrorResponses, successResponse, validationErrorResponse, errorResponse } = require("../utils/ErrorHandling");
const Otp = require("../Email/Otp");
const nodemailer = require('nodemailer');
const NotificationModel = require("../model/Notification");
const directionModel = require("../model/direction");
const axios = require('axios');
const { uploadFile } = require("../utils/S3");
const mongoose = require("mongoose");

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000); // Generates a 6-digit OTP
}

exports.login = catchAsync(async (req, res) => {
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
            return ApperrorResponses(res, "Invalid email", 401);
        }
        if (user?.role !== "driver") {
            return ApperrorResponses(
                res,
                "Only drivers are allowed to login on the app",
                401,
                "false"
            );
        }

        if (password != user.password) {
            return ApperrorResponses(res, "Invalid password", 401);
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET_KEY,
            { expiresIn: process.env.JWT_EXPIRES_IN || "365d" }
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
        return ApperrorResponses(res, error.message || "Internal Server Error", 500);
    }
});

exports.UpdateDriver = catchAsync(async (req, res) => {
    try {
        if (!req.user.id) {
            return ApperrorResponses(res, "No users found", 404);
        }
        const { driver_name, mc_number, company_name } = req.body;
        const driverResult = await Driver.findOne({ driver_id_ref: req.user.id });
        if (!driverResult) {
            return ApperrorResponses(res, "Driver already exists.", 400);
        }
        const DriverRecord = await Driver.findByIdAndUpdate(driverResult?._id, {
            mc_number: mc_number,
            company_name: company_name,
        })
        const UserRecord = await User.findByIdAndUpdate(req.user.id, {
            name: driver_name,
        })
        successResponse(res, "Driver update successfully!", 201,);
    } catch (error) {
        if (error.code === 11000) {
            return ApperrorResponses(res, "Email already exists.", 400);
        }
        ApperrorResponses(res, error.message || "Internal Server Error", 500);
    }
});

exports.GetDrivers = catchAsync(async (req, res) => {
    try {
        const UserId = req.user.id;
        if (!UserId) {
            return ApperrorResponses(res, "No users found", 404);
        }
        const driverResult = await Driver.findOne({ driver_id_ref: UserId });
        const UserResult = await User.findOne({ _id: UserId }).select("name");

        if (!driverResult) {
            return ApperrorResponses(res, "Driver already exists.", 400);
        }
        if (driverResult) {
            successResponse(res, "Driver Get successful!", 201, {
                driver: driverResult,
                UserResult: UserResult
            });
        }
    } catch (error) {
        if (error.code === 11000) {
            return ApperrorResponses(res, "Email already exists.", 400);
        }
        ApperrorResponses(res, error.message || "Internal Server Error", 500);
    }
});

exports.ShipmentGet = catchAsync(async (req, res) => {
    try {
        const shipments = await shipment.find({ driver_id: req.user.id, status: { $ne: "delivered" }, driver_location: { $ne: "reached" } }).populate([
            { path: "broker_id", select: "name email" },
            { path: "shipper_id", select: "name email" },
            { path: "customer_id", select: "name email" },
            { path: "driver_id", select: "name email" },
            { path: "carrier_id", select: "name email" }
        ]);
        const shipmentdelivered = await shipment.find({ driver_id: req.user.id, status: "delivered", driver_location: "delivered" }).populate([
            { path: "broker_id", select: "name email" },
            { path: "shipper_id", select: "name email" },
            { path: "customer_id", select: "name email" },
            { path: "driver_id", select: "name email" },
            { path: "carrier_id", select: "name email" }
        ]);
        const directionGet = await directionModel.findOne({
            Shipment_id: shipments._id,
        });
        if (!shipments) {
            return ApperrorResponses(res, "Shipment not found", 404);
        }
        successResponse(res, "Shipment fetched successfully", 200, {
            directionGet, shipments, shipmentdelivered
        });
    } catch (error) {
        return ApperrorResponses(res, error.message || "Internal Server Error", 500);
    }
})

exports.getShipmentDetilas = catchAsync(async (req, res) => {
    try {
        const { id } = req.params;
        let shipments = await shipment.find({ _id: id }).populate([
            { path: "broker_id", select: "name email contact" },
            { path: "shipper_id", select: "name email contact" },
            { path: "customer_id", select: "name email contact" },
            { path: "driver_id", select: "name email contact" },
            { path: "carrier_id", select: "name email contact" }
        ]).sort({ created_at: -1 });

        if (!shipments || shipments.length === 0) {
            return errorResponse(res, "No data found", 404);
        }

        // Convert to an array of plain objects
        shipments = shipments.map((shipment) => shipment.toObject());

        // Fetch driver data for each shipment that has a driver_id
        await Promise.all(
            shipments.map(async (shipment) => {
                if (shipment.driver_id) {
                    const driverData = await Driver.findOne({ driver_id_ref: shipment.driver_id._id });
                    if (driverData) {
                        shipment.driver_id = { ...shipment.driver_id, ...driverData.toObject() };
                    }
                }
            })
        );

        return successResponse(res, "Shipments fetched successfully", 200, shipments);
    } catch (error) {
        return errorResponse(res, error.message || "Internal Server Error", 500);
    }
});

exports.forgotlinkrecord = catchAsync(async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return validationErrorResponse(res, { email: 'Email is required' });
        }
        const record = await User.findOne({ email: email });
        if (!record) {
            return ApperrorResponses(res, "No user found with this email", 404);
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
        return ApperrorResponses(res, "Failed to send email");
    }
}
);

exports.forgotpassword = catchAsync(async (req, res) => {
    try {
        const { email, newPassword, Otp } = req.body;
        const user = await User.findOne({ email: email, Otp: Otp });
        if (!user) {
            return ApperrorResponses(res, "Invalid Email or Otp", 404);
        }
        user.password = newPassword
        await user.save();
        return successResponse(res, "Password has been successfully reset");
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return ApperrorResponses(res, "Token has expired. Please generate a new token.", 401);
        }
        console.error("Error in password reset process:", error);
        return ApperrorResponses(res, "Failed to reset password");
    }
}
);

exports.forgotOTP = catchAsync(async (req, res) => {
    try {
        const { Otp, email } = req.body;

        const user = await User.findOne({ email: email });
        if (!user) {
            return ApperrorResponses(res, "Invalid Emaill", 404);
        }

        if (user.Otp !== Otp) {
            return ApperrorResponses(res, "Invalid OTP ", 404);
        }
        user.OtpVerify = true;
        await user.save();
        return successResponse(res, "OTP verified successfully");
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return ApperrorResponses(res, "Token has expired. Please generate a new token.", 401);
        }
        console.error("Error in OTP verification process:", error);
        return ApperrorResponses(res, "Failed to verify OTP", 500);
    }
});


exports.NotificationDriverGet = catchAsync(async (req, res) => {
    const UserId = req.user.id;
  
    try {
      const query = {
        $or: [{ ReciverId: UserId, IsRead: false }],
      };
  
      const notifications = await NotificationModel.find(query)
        .sort({ createdAt: -1 })
        .populate({
          path: "ShipmentId",
          select: "name", // Only fetch the name field
        })
        .populate({
          path: "ReciverId",
          select: "name email role", // Only fetch name and email from ReciverId.Receiver
        })
        .populate({
          path: "SenderId",
          select: "name email role", // Only fetch name and email from ReciverId.Receiver
        });
  
      const notificationCount = notifications.length;
      res.json({
        status: true,
        data: notifications,
        count: notificationCount,
        message: "Notifications fetched successfully",
      });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({
        status: false,
        message: error.message || "Failed to fetch notifications",
      });
    }
  });

exports.MarkNotificationAsRead = catchAsync(async (req, res) => {
    const { id } = req.body;
    try {
      if (!id) {
        return res.status(400).json({
          status: false,
          message: "ID is required",
        });
      }
  
      // Find notification by ID
      const notification = await NotificationModel.findById(id);
  
      if (!notification) {
        return res.status(404).json({
          status: false,
          message: "Notification not found",
        });
      }
  
      // Update the isRead field to true
      notification.IsRead = true;
      await notification.save();
  
      res.json({
        status: true,
        message: "Notification marked as read successfully",
        notification,
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({
        status: false,
        message: error.message || "Failed to mark notification as read",
      });
    }
  });

exports.updateShipmentData = catchAsync(async (req, res) => {
    try {
        const userId=req.user.id;
        const Id = req.params.id;
        const notification = await NotificationModel.findOneAndDelete(
            { ShipmentId: Id, ReciverId:userId },
            
        );
        const shipments = await shipment.findOneAndUpdate(
            { _id: Id },
            {
                driverAccept: "false",
                driver_id: null,
                status: "pending"
            },
            {
                new: true,  // Return the updated document
                runValidators: true  // Run schema validators
            }
        );

        if (!shipments) {
            return ApperrorResponses(res, "Shipment not found", 404, false);
        }

        return successResponse(res, "Shipment Cancelled successfully", 200, shipments); // Corrected response object
    } catch (error) {
        return ApperrorResponses(res, error.message || "Internal Server Error", 500);
    }
});

exports.DriverReached = catchAsync(async (req, res) => {
    try {
        const Id = req.params.id;
        const updatedShipment = await shipment.findByIdAndUpdate(
            { _id: Id },
            { driver_location: "Reached" },
            {
                new: true,
                runValidators: true,
            }
        );

        if (!updatedShipment) {
            return ApperrorResponses(res, "Shipment not found", 404, false);
        }

        return successResponse(res, "Shipment updated successfully", 200, updatedShipment);
    } catch (error) {
        return ApperrorResponses(res, error.message || "Internal Server Error", 500);
    }
});

exports.updateShipmentSign = catchAsync(async (req, res) => {
    try {
        const type = req?.body?.signType
        if (!req.file) {
            return ApperrorResponses(res, "No file uploaded", 400, false);
        }
        const Id = req.params.id;
        const result = await uploadFile(req, res); // Upload file to S3
        const fileUrl = result?.fileUrl;
        if (!fileUrl) {
            return ApperrorResponses(res, "File upload failed", 500, false);
        }
        const fieldToUpdate = type === 'customer' ? 'customer_sign' : 'driver_sign';
        let updatedShipment;
        if (fieldToUpdate === "customer_sign") {
            updatedShipment = await shipment.findOneAndUpdate(
                { _id: Id },
                { [fieldToUpdate]: fileUrl, status: "delivered", driver_location: "delivered" },
                { new: true, runValidators: true }
            );
        }
        else {
            updatedShipment = await shipment.findOneAndUpdate(
                { _id: Id },
                { [fieldToUpdate]: fileUrl, driver_location: "running" },
                { new: true, runValidators: true }
            );
        }

        if (!updatedShipment) {
            return ApperrorResponses(res, "Shipment not found", 404, false);
        }

        return successResponse(res, "Shipment updated successfully", 200, updatedShipment);
    } catch (error) {
        return ApperrorResponses(res, error.message || "Internal Server Error", 500);
    }
});

exports.updateDirections = catchAsync(async (req, res) => {
    let { Shipment_id, lat, long } = req.body;
    try {
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;
        // Reverse Geocode to get Address from Lat/Long
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${long}&key=${apiKey}`;
        const geocodeResponse = await axios.get(geocodeUrl);
        if (geocodeResponse.data.status !== 'OK') {
            return res.status(400).json({
                success: false,
                message: "Failed to convert coordinates to address",
            });
        }
        // Extract formatted address from Geocode API
        const formattedAddress = geocodeResponse.data.results[0].formatted_address;
        const CurrentLocation = {
            location: formattedAddress,
            lat,
            lng: long
        };
        // Update shipment record with current location
        const shipments = await shipment.findOneAndUpdate(
            { _id: Shipment_id },
            { current_location: formattedAddress },
            { new: true, runValidators: true }
        );
        // Find shipment document in directionModel
        const doc = await directionModel.findOne({ Shipment_id });
        if (!doc) {
            return res.status(404).json({
                success: false,
                message: "Shipment not found",
            });
        }
        const { StartLocation, EndLocation } = doc;
        // Get Directions from Start to Current and Current to End
        const startToCurrentUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${StartLocation.lat},${StartLocation.lng}&destination=${lat},${long}&key=${apiKey}`;
        const currentToEndUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${lat},${long}&destination=${EndLocation.lat},${EndLocation.lng}&key=${apiKey}`;

        const [startToCurrentResponse, currentToEndResponse] = await Promise.all([
            axios.get(startToCurrentUrl),
            axios.get(currentToEndUrl),
        ]);

        if (startToCurrentResponse.data.status === 'OK' && currentToEndResponse.data.status === 'OK') {
            const startToCurrentLeg = startToCurrentResponse.data.routes[0].legs[0];
            const currentToEndLeg = currentToEndResponse.data.routes[0].legs[0];

            const routeDetails = {
                StartToEndDistance: doc.routeDetails.StartToEndDistance,
                StartToEndDuration: doc.routeDetails.StartToEndDuration,
                StartToEndPolyline: doc.routeDetails.StartToEndPolyline,
                StartToCurrentDistance: startToCurrentLeg.distance.text,
                StartToCurrentDuration: startToCurrentLeg.duration.text,
                StartToCurrentPolyline: startToCurrentResponse.data.routes[0].overview_polyline.points,
                CurrentToEndDistance: currentToEndLeg.distance.text,
                CurrentToEndDuration: currentToEndLeg.duration.text,
                CurrentToEndPolyline: currentToEndResponse.data.routes[0].overview_polyline.points,
            };

            // Update shipment with new directions
            const updatedDoc = await directionModel.findOneAndUpdate(
                { Shipment_id },
                {
                    $set: {
                        EndLocation: {
                            location: EndLocation.location,
                            lat: EndLocation.lat,
                            lng: EndLocation.lng,
                            distance: currentToEndLeg.distance.text,
                            duration: currentToEndLeg.duration.text,
                            polyline: currentToEndResponse.data.routes[0].overview_polyline.points,
                        },
                        routeDetails,
                    },
                    $push: {
                        CurrentLocation: {
                            lat: CurrentLocation.lat,
                            lng: CurrentLocation.lng,
                            location: CurrentLocation.location,
                            distance: startToCurrentLeg.distance.text,
                            duration: startToCurrentLeg.duration.text,
                            polyline: startToCurrentResponse.data.routes[0].overview_polyline.points,
                            createdAt: new Date(),
                        },
                    },
                },
                { new: true }
            );

            return res.json({
                success: true,
                message: "Directions updated successfully",
                data: updatedDoc,
            });
        } else {
            return res.status(400).json({
                success: false,
                message: 'Failed to fetch directions from Google Maps API',
            });
        }
    } catch (error) {
        console.error("Error updating directions:", error.message);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

exports.DashboardDriverApi = catchAsync(async (req, res) => {
    try {
        const { user } = req;
        const shipperId = new mongoose.Types.ObjectId(user.id);
        let filter = {};
        if (user?.role === "driver") {
            filter = { driver_id: shipperId };
        }
        let statusData = {
            delivered: 0,
            pending: 0,
            transit: 0
        };
        let [statusCounts, Shipment, ShipmentData] = await Promise.all([
            shipment.aggregate([
                { $match: filter },
                { $group: { _id: "$status", count: { $sum: 1 } } },
            ]),
            shipment.countDocuments(filter),
            shipment
                .find(filter)
                .populate([
                    { path: "broker_id", select: "name email" },
                    { path: "shipper_id", select: "name email" },
                    { path: "customer_id", select: "name email" },
                    { path: "driver_id", select: "name email" },
                    { path: "carrier_id", select: "name email" },
                ])
                .sort({ created_at: -1 })
                .limit(4),
        ]);

        statusCounts.forEach(({ _id, count }) => {
            if (statusData.hasOwnProperty(_id)) {
                statusData[_id] = count;
            }
        });
        if (ShipmentData && ShipmentData.length !== 0) {
            ShipmentData = ShipmentData.map((shipment) => shipment.toObject());
            await Promise.all(
                ShipmentData.map(async (shipment) => {
                    if (shipment.driver_id) {
                        const driverData = await Driver.findOne({
                            driver_id_ref: shipment.driver_id._id,
                        });
                        if (driverData) {
                            shipment.driver_id = {
                                ...shipment.driver_id,
                                ...driverData.toObject(),
                            };
                        }
                    }
                })
            );
        }

        res.json({
            status: true,
            message: "Dashboard fetched successfully",
            data: { Shipment, statusData, ShipmentData },
        });
    } catch (error) {
        console.error("Error occurred:", error);
        errorResponse(res, error.message || "Failed to fetch profile", 500);
    }
});



// server {
//     listen 80;
//     server_name tracebill.com www.tracebill.com;

//     location / {
//         proxy_pass http://13.61.214.119:3000;
//         proxy_set_header Host $host;
//         proxy_set_header X-Real-IP $remote_addr;
//         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
//         proxy_set_header X-Forwarded-Proto $scheme;
//     }
// }

// server {
//     listen 80;
//     server_name api.tracebill.com;

//     location / {
//         proxy_pass http://13.61.214.119:5000;
//         proxy_set_header Host $host;
//         proxy_set_header X-Real-IP $remote_addr;
//         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
//         proxy_set_header X-Forwarded-Proto $scheme;
//     }
// }