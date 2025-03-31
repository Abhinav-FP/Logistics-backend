
const catchAsync = require("../utils/catchAsync");
const NotificationModel = require("../model/Notification");
const ObjectId = require("mongoose").Types.ObjectId;

exports.createNotification = catchAsync(async (req, res) => {
    try {
        const {
            senderId,
            receiverShipperId,
            receiverCustomerId,
            receiverBrokerId,
            receiverCarrierId,
            ShipmentId,
        } = req.body;
        const record = new NotificationModel({
            senderId,
            receiverShipperId,
            receiverCustomerId: receiverCustomerId.map((obj) => ({
                Receiver: obj.Receiver,
                IsRead :false
            })),
            receiverBrokerId: receiverBrokerId.map((obj) => ({
                Receiver: obj.Receiver,
                IsRead :false
            })),
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
            $and: [
                {
                    $or: [
                        { "receiverShipperId.Receiver": UserId },
                        { "receiverCustomerId.Receiver": UserId },
                        { "receiverBrokerId.Receiver": UserId },
                        { "receiverCarrierId.Receiver": UserId },
                    ],
                },
                {
                    $or: [
                        {
                            "receiverShipperId.IsRead": false,
                            "receiverShipperId.Receiver": UserId,
                        },
                        {
                            "receiverCustomerId.IsRead": false,
                            "receiverCustomerId.Receiver": UserId,
                        },
                        {
                            "receiverBrokerId.IsRead": false,
                            "receiverBrokerId.Receiver": UserId,
                        },
                        {
                            "receiverCarrierId.IsRead": false,
                            "receiverCarrierId.Receiver": UserId,
                        },
                    ],
                },
            ],
        };
        const notification = await NotificationModel.find(query)
            .sort({ createdAt: -1 })
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
            message: "Notifications fetched successfully",
        });
    } catch (error) {
        console.error("Error:", error);
        res.json({
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
        });

        if (!notification) {
            return res.status(404).json({
                status: false,
                message: "Notification not found",
            });
        }

        let updated = false;

        notification.receiverShipperId.forEach((receiver) => {
            if (receiver.Receiver && receiver.Receiver.equals(UserId)) {
                receiver.IsRead = true;
                updated = true;
            }
        });

        notification.receiverCustomerId.forEach((receiver) => {
            if (receiver.Receiver && receiver.Receiver.equals(UserId)) {
                receiver.IsRead = true;
                updated = true;
            }
        });

        notification.receiverBrokerId.forEach((receiver) => {
            if (receiver.Receiver && receiver.Receiver.equals(UserId)) {
                receiver.IsRead = true;
                updated = true;
            }
        });

        notification.receiverCarrierId.forEach((receiver) => {
            if (receiver.Receiver && receiver.Receiver.equals(UserId)) {
                receiver.IsRead = true;
                updated = true;
            }
        });

        if (!updated) {
            return res.status(404).json({
                status: false,
                message: "UserId not found in any receivers",
            });
        }

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
    const { ShipmentId, receiverBrokerId, receiverDriverId, receiverCarrierId, receiverShipperId, receiverCustomerId  ,text} = req.body;
    try {
        const existingNotification = await NotificationModel.findOne({ ShipmentId: ShipmentId });
        await NotificationModel.findOneAndUpdate(existingNotification._id, {
            $set: {
                'receiverDriverId': [{ Receiver: receiverDriverId, IsRead: false, }],
            },
            Text: "The user review has been delivered",
        }, { new: true });
        await NotificationModel.findOneAndUpdate(existingNotification._id, {
            $set: {
                'receiverCarrierId': [{ Receiver: receiverCarrierId, IsRead: false, }],
            },
            Text: "The user review has been delivered",
        }, { new: true });
        await NotificationModel.findOneAndUpdate(existingNotification._id, {
            $set: {
                'receiverBrokerId': [{ Receiver: receiverBrokerId, IsRead: false, }],
            },
            Text: "The user review has been delivered",
        }, { new: true });
        await NotificationModel.findOneAndUpdate(existingNotification._id, {
            $set: {
                'receiverShipperId': [{ Receiver: receiverShipperId, IsRead: false, }],
            },

            Text: "The user review has been delivered",
        }, { new: true });
        await NotificationModel.findOneAndUpdate(existingNotification._id, {
            $set: {
                'receiverCustomerId': [{ Receiver: receiverCustomerId, IsRead: true, }],
            },
            Text: "The user review has been delivered",
        }, { new: true });
    } catch (error) {
        console.log("eror", error);
    }
});
