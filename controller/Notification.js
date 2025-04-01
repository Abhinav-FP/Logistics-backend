
const catchAsync = require("../utils/catchAsync");
const NotificationModel = require("../model/Notification");
const ObjectId = require("mongoose").Types.ObjectId;
const mongoose = require("mongoose");


exports.createNotification = catchAsync(async (req, res) => {
    try {
        const {
            SenderId ,
            ReciverId,
            ShipmentId,
            text
        } = req.body;

        console.log("req.body:", req.body);

        const recordData = {
            SenderId,
            ShipmentId,
            ReciverId,
            text
        };
   
        const record = new NotificationModel(recordData);
        const data = await record.save();
        console.log("Saved Data:", data);
    } catch (error) {
        console.error("Error saving notification:", error);
    }
});

exports.updateNotification = catchAsync(async (req, res) => {
    try {
        const { receiverCarrierId, ShipmentId, receiverDriverId, receiverCustomerId, receiverBrokerId } = req.body;
        const formatToArray = (value) => (value ? (Array.isArray(value) ? value : [{ Receiver: value }]) : []);
        const existingNotification = await NotificationModel.findOne({ ShipmentId });
        if (!existingNotification) {
            return res.status(404).json({ message: "Notification not found" });
        }
        const newCarrierIds = formatToArray(receiverCarrierId);
        const newDriverIds = formatToArray(receiverDriverId);
        const newCustomerIds = formatToArray(receiverCustomerId);
        const newBrokerIds = formatToArray(receiverBrokerId);

        const addUniqueReceivers = (existingArray, newArray) => {
            return [
                ...existingArray,
                ...newArray.filter(
                    (newId) =>
                        newId.Receiver &&
                        !existingArray.some(
                            (existingId) =>
                                existingId.Receiver &&
                                existingId.Receiver.toString() === newId.Receiver.toString()
                        )
                ),
            ];
        };

        existingNotification.receiverCarrierId = addUniqueReceivers(existingNotification.receiverCarrierId, newCarrierIds);
        existingNotification.receiverDriverId = addUniqueReceivers(existingNotification.receiverDriverId, newDriverIds);
        existingNotification.receiverCustomerId = addUniqueReceivers(existingNotification.receiverCustomerId, newCustomerIds);
        existingNotification.receiverBrokerId = addUniqueReceivers(existingNotification.receiverBrokerId, newBrokerIds);

        const updatedNotification = await existingNotification.save();

    } catch (error) {
        console.error(error);
    }
});

exports.NotificationGet = catchAsync(async (req, res) => {
    const UserId = req.user.id;

    try {
        const query = {
            $or: [
                { "ReciverId":  UserId  , IsRead :false}
            ],
        };

        const notifications = await NotificationModel.find(query)
            .sort({ createdAt: -1 })
            .populate({
                path: "ShipmentId",
                select: "name" // Only fetch the name field
            })
            .populate({
                path: "ReciverId",
                select: "name email role" // Only fetch name and email from ReciverId.Receiver
            }).populate({
                path: "SenderId",
                select: "name email role" // Only fetch name and email from ReciverId.Receiver
            });

        const notificationCount = notifications.length;

        console.log("Fetched Notifications:", notifications);

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
    const UserId = req.user.id;
    const { shipmentId } = req.body;

    if (!UserId || !shipmentId) {
        return res.status(400).json({
            status: false,
            message: "UserId and ShipmentId are required",
        });
    }

    try {
        const notification = await NotificationModel.findOne({
            ShipmentId: shipmentId,
            ReciverId: UserId, // Check if UserId matches ReciverId
        });

        if (!notification) {
            return res.status(404).json({
                status: false,
                message: "Notification not found for this user and shipment",
            });
        }

        // Update the IsRead field to true
        notification.IsRead = true;
        const result = await notification.save();

        res.json({
            status: true,
            message: "Notification marked as read successfully",
            notification: result,
        });
    } catch (error) {
        console.error("Error occurred:", error);
        res.status(500).json({
            status: false,
            message: error.message || "Failed to mark notification as read",
        });
    }
});


exports.updateStatusNotification = catchAsync(async (req, res) => {
    const { ShipmentId, receiverCustomerId, receiverBrokerId } = req.body;
    try {
        const existingNotification = await NotificationModel.findOne({ ShipmentId: ShipmentId });
        const result = await NotificationModel.findOneAndUpdate(existingNotification._id, {
            $set: {
                'receiverCustomerId': [{ Receiver: receiverCustomerId, IsRead: false }],
                'receiverBrokerId': [{ Receiver: receiverBrokerId, IsRead: false }],
            }
        }, { new: true });
    } catch (error) {
        console.log("eror", error);
    }
});

exports.updateReviewNotification = catchAsync(async (req, res) => {
    console.log("req.body", req.body)
    const { ShipmentId, receiverBrokerId, receiverDriverId, receiverCarrierId, receiverShipperId, receiverCustomerId, text1, text2, text } = req.body;
    // broker  assign dispatch  sheet carrire then  carrier text 1 
    // carrire  assign dispatch  sheet broker then  carrier text 2 
    // broker  Reassign dispatch  sheet carrire then  carrier text 1

    try {
        const existingNotification = await NotificationModel.findOne({ ShipmentId: ShipmentId });
        await NotificationModel.findOneAndUpdate(existingNotification._id, {
            $set: {
                'receiverDriverId': [{ Receiver: receiverDriverId, IsRead: false, text: text }],
            },
        }, { new: true });
        await NotificationModel.findOneAndUpdate(existingNotification._id, {
            $set: {
                'receiverCarrierId': [{ Receiver: receiverCarrierId, IsRead: false, text: text1 ? text1 : text }],
            },
        }, { new: true });
        await NotificationModel.findOneAndUpdate(existingNotification._id, {
            $set: {
                'receiverBrokerId': [{ Receiver: receiverBrokerId, IsRead: false, text: text2 ? text2 : text }],
            },
        }, { new: true });
        await NotificationModel.findOneAndUpdate(existingNotification._id, {
            $set: {
                'receiverShipperId': [{ Receiver: receiverShipperId, IsRead: false, text: text }],
            },
        }, { new: true });
        await NotificationModel.findOneAndUpdate(existingNotification._id, {
            $set: {
                'receiverCustomerId': [{ Receiver: receiverCustomerId, IsRead: true, text: text }],
            },
        }, { new: true });
    } catch (error) {
        console.log("eror", error);
    }
});
