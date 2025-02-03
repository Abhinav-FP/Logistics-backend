const Driver = require("../model/driver");
const shipment = require("../model/shipment");
const User = require("../model/user");
const catchAsync = require("../utils/catchAsync");
const { errorResponse, successResponse } = require("../utils/ErrorHandling");
const Otp = require("../Email/Otp");
const nodemailer = require('nodemailer');
const NotificationModel = require("../model/Notification");
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000); // Generates a 6-digit OTP
}

exports.UpdateDriver = catchAsync(async (req, res) => {
    try {
        const { vin, address, trucktype } = req.body;
        if (!req.user.id) {
            return errorResponse(res, "No users found", 404);
        }
        const driverResult = await Driver.findOne({ driver_id_ref: req.user.id });
        if (!driverResult) {
            return errorResponse(res, "Driver already exists.", 400);
        }
        const DriverRecord = await Driver.findByIdAndUpdate(driverResult?._id, {
            vin: vin,
            address: address,
            trucktype: trucktype,
        })
        successResponse(res, "Customer created successfully!", 201, {
            DriverRecord,
        });
    } catch (error) {
        if (error.code === 11000) {
            return errorResponse(res, "Email already exists.", 400);
        }
        errorResponse(res, error.message || "Internal Server Error", 500);
    }
});

exports.GetDriver = catchAsync(async (req, res) => {
    try {
        const { UserId } = req.user.id;
        if (!UserId) {
            return errorResponse(res, "No users found", 404);
        }
        const driverResult = await Driver.findOne({ driver_id_ref: UserId });
        if (!driverResult) {
            return errorResponse(res, "Driver already exists.", 400);
        }
        if (driverResult) {
            successResponse(res, "Customer created successfully!", 201, {
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
        const shipments = await shipment.find({ driver_id: driver_id });
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