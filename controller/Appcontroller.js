const Driver = require("../model/driver");
const shipment = require("../model/shipment");
const User = require("../model/user");
const catchAsync = require("../utils/catchAsync");
const jwt = require("jsonwebtoken");
const { errorResponse, successResponse, validationErrorResponse } = require("../utils/ErrorHandling");
const Otp = require("../Email/Otp");
const nodemailer = require('nodemailer');
const NotificationModel = require("../model/Notification");
const directionModel = require("../model/direction");
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000); // Generates a 6-digit OTP
}

exports.UpdateDriver = catchAsync(async (req, res) => {
    try {
        const { driver_name, mc_number, company_name } = req.body;
        if (!req.user.id) {
            return errorResponse(res, "No users found", 404);
        }
        const driverResult = await Driver.findOne({ driver_id_ref: req.user.id });
        if (!driverResult) {
            return errorResponse(res, "Driver already exists.", 400);
        }
        const DriverRecord = await Driver.findByIdAndUpdate(driverResult?._id, {
            mc_number: mc_number,
            company_name: company_name,
        })
        const UserRecord = await User.findByIdAndUpdate(req.user.id, {
            name: driver_name,
        })
        successResponse(res, "Customer created successfully!", 201, {
            DriverRecord,
            UserRecord
        });
    } catch (error) {
        if (error.code === 11000) {
            return errorResponse(res, "Email already exists.", 400);
        }
        errorResponse(res, error.message || "Internal Server Error", 500);
    }
});

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
        return errorResponse(res, "Invalid email", 401);
      }
      if (user?.role !== "driver") {
        return errorResponse(
          res,
          "Only drivers are allowed to login on the app",
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

exports.GetDrivers = catchAsync(async (req, res) => {
    try {
        const UserId = req.user.id;
        if (!UserId) {
            return errorResponse(res, "No users found", 404);
        }
        const driverResult = await Driver.findOne({ driver_id_ref: UserId });
        if (!driverResult) {
            return errorResponse(res, "Driver already exists.", 400);
        }
        if (driverResult) {
            successResponse(res, "Driver Get successful!", 201, {
                driver: driverResult,
            });
        }
    } catch (error) {
        if (error.code === 11000) {
            return errorResponse(res, "Email already exists.", 400);
        }
        errorResponse(res, error.message || "Internal Server Error", 500);
    }
});

exports.ShipmentGet = catchAsync(async (req, res) => {
    try {
        const { driver_id } = req.params;
        const shipments = await shipment.find({ driver_id: driver_id }).populate([
            { path: "broker_id", select: "name email" },
            { path: "shipper_id", select: "name email" },
            { path: "customer_id", select: "name email" },
            { path: "driver_id", select: "name email" },
            { path: "carrier_id", select: "name email" }
        ]);
        if (!shipments) {
            return errorResponse(res, "Shipment not found", 404);
        }
        successResponse(res, "Shipment fetched successfully", 200, shipments);
    } catch (error) {
        return errorResponse(res, error.message || "Internal Server Error", 500);
    }
})

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

exports.forgotOTP = catchAsync(async (req, res) => {
    try {
        const { Otp } = req.body;
        console.log("Received OTP:", Otp);

        const user = await User.findOne({ Otp: Otp });
        console.log("User found:", user);
        if (!user) {
            return errorResponse(res, "OTP not found", 404);
        }
        user.OtpVerify = true;
        await user.save();
        return successResponse(res, "OTP verified successfully");
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return errorResponse(res, "Token has expired. Please generate a new token.", 401);
        }
        console.error("Error in OTP verification process:", error);
        return errorResponse(res, "Failed to verify OTP", 500);
    }
});

exports.NotificationDriverGet = catchAsync(async (req, res) => {
    const UserId = req.user.id;
    try {
        const query = {
            $and: [
                {
                    $or: [
                        { "receiverDriverId.Receiver": UserId },
                    ]
                },
                {
                    $or: [
                        { "receiverDriverId.IsRead": false, "receiverDriverId.Receiver": UserId },

                    ]
                }
            ]
        };


        const notification = await NotificationModel.find(query).sort({ createdAt: -1 })
            .populate("ShipmentId")
            .populate("receiverDriverId.Receiver", "-password");
        const notificationCount = notification.length;
        // data: notification,
        res.json({
            status: true,
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

        notification.receiverDriverId.forEach(receiver => {
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


exports.updateShipmentData = catchAsync(async (req, res) => {
    try {
        console.log("req.body", req.body)
        const Id = req.params.id;

        const notification = await NotificationModel.findOneAndUpdate(
            { ShipmentId: Id },
            {
                receiverDriverId: [
                    {
                        Receiver: null,
                        IsRead: false,
                    },
                ],
            },
            { new: true }
        );
        if (notification) {
            console.log("Notification updated successfully:", notification);
        } else {
            console.log("Notification not found.");
        }
        const shipments = await shipment.findOneAndUpdate(
            { _id: Id },
            {
                driverAccept: "false",
                driver_id: null
            },
            {
                new: true,  // Return the updated document
                runValidators: true  // Run schema validators
            }
        );

        console.log("shipments", shipments)
        if (!shipments) {
            return errorResponse(res, "Shipment not found", 404, false);
        }

        return successResponse(res, "Shipment updated successfully", 200, shipments); // Corrected response object
    } catch (error) {
        return errorResponse(res, error.message || "Internal Server Error", 500);
    }
});

exports.updateShipmentSign = catchAsync(async (req, res) => {
    try {
        console.log("req.body", req.body)
        const { customer_sign, driver_sign } = req.body;
        console.log("req.params.id", req.params.id);
        const Id = req.params.id;
        const shipments = await shipment.findOneAndUpdate(
            { _id: Id },
            {
                customer_sign: customer_sign,
                driver_sign: driver_sign
            },
            {
                new: true,
                runValidators: true
            }
        );
        if (!shipments) {
            return errorResponse(res, "Shipment not found", 404, false);
        }

        return successResponse(res, "Shipment updated successfully", 200, shipments); // Corrected response object
    } catch (error) {
        return errorResponse(res, error.message || "Internal Server Error", 500);
    }
});



exports.updateDirections = catchAsync(async (req, res) => {
    let { Shipment_id, CurrentLocation } = req.body;
    try {
        const parseLocation = (location) => {
            const [lat, lng] = location.split(',').map(Number);
            return { lat, lng };
        };
        CurrentLocation = parseLocation(CurrentLocation);

        const doc = await directionModel.findOne({ Shipment_id });
        if (!doc) {
            console.error("No document found with Shipment_id:", Shipment_id);
            return res.status(404).json({
                success: false,
                message: "Shipment not found"
            });
        }

        if (!Array.isArray(doc.CurrentLocation)) {
            await directionModel.updateOne({ Shipment_id }, { $set: { CurrentLocation: [] } });
        }

        const { StartLocation, EndLocation } = doc;

        const apiKey = process.env.GOOGLE_MAPS_API_KEY;

        const StartToCurrentUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${StartLocation.lat},${StartLocation.lng}&destination=${CurrentLocation.lat},${CurrentLocation.lng}&key=${apiKey}`;
        const currentToEndUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${CurrentLocation.lat},${CurrentLocation.lng}&destination=${EndLocation.lat},${EndLocation.lng}&key=${apiKey}`;

        const [StartToCurrentResponse, currentToEndResponse] = await Promise.all([
            axios.get(StartToCurrentUrl),
            axios.get(currentToEndUrl),
        ]);

        if (StartToCurrentResponse.data.status === 'OK' && currentToEndResponse.data.status === 'OK') {
            const StartToCurrentLeg = StartToCurrentResponse.data.routes[0].legs[0];
            const currentToEndLeg = currentToEndResponse.data.routes[0].legs[0];

            const routeDetails = {
                StartToEndDistance: doc.routeDetails.StartToEndDistance,
                StartToEndDuration: doc.routeDetails.StartToEndDuration,
                StartToEndPolyline: doc.routeDetails.StartToEndPolyline,
                StartToCurrentDistance: StartToCurrentLeg.distance.text,
                StartToCurrentDuration: StartToCurrentLeg.duration.text,
                StartToCurrentPolyline: StartToCurrentResponse.data.routes[0].overview_polyline.points,
                currentToEndDistance: currentToEndLeg.distance.text,
                currentToEndDuration: currentToEndLeg.duration.text,
                currentToEndPolyline: currentToEndResponse.data.routes[0].overview_polyline.points,
            };

            const result = await directionModel.findOneAndUpdate(
                { Shipment_id },
                {
                    $set: {
                        EndLocation: {
                            lat: EndLocation.lat,
                            lng: EndLocation.lng,
                            distination: currentToEndLeg.distance.text,
                            duration: currentToEndLeg.duration.text,
                            startToEndPolyline: currentToEndResponse.data.routes[0].overview_polyline.points,
                        },
                        routeDetails,
                    },
                    $push: {
                        CurrentLocation: {
                            lat: CurrentLocation.lat,
                            lng: CurrentLocation.lng,
                            distination: StartToCurrentLeg.distance.text,
                            duration: StartToCurrentLeg.duration.text,
                            CurrentPolyline: StartToCurrentResponse.data.routes[0].overview_polyline.points,
                            created_at: new Date(),
                        },
                    },
                },
                { new: true }
            );

            res.json({
                success: true,
                message: "Directions updated successfully",
                data: result
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to fetch directions from Google Maps API',
            });
        }
    } catch (error) {
        console.error("Error updating directions:", error.message);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}
);