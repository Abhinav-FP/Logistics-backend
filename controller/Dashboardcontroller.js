const User = require("../model/user");
const mongoose = require("mongoose");
const Driver = require("../model/driver");
const {errorResponse} = require("../utils/ErrorHandling");
const catchAsync = require("../utils/catchAsync");
const shipment = require("../model/shipment");

// Shipper dashboard
exports.DashboardShipperApi = catchAsync(async (req, res) => {
    try {
        const Users = await User.aggregate([
            { $group: { _id: "$role", count: { $sum: 1 } } },
        ]);

        // Ensure req.user.id is converted correctly to ObjectId
        const shipperId = new mongoose.Types.ObjectId(req.user.id);

        const Shipment = await shipment.countDocuments({ shipper_id: shipperId });

        const statusCounts = await shipment.aggregate([
            { $match: { shipper_id: shipperId } },
            { $group: { _id: "$status", count: { $sum: 1 } } },
        ]);

        let ShipmentData = await shipment
            .find({ shipper_id: shipperId })
            .populate([
                { path: "broker_id", select: "name email" },
                { path: "shipper_id", select: "name email" },
                { path: "customer_id", select: "name email" },
                { path: "driver_id", select: "name email" },
                { path: "carrier_id", select: "name email" },
            ])
            .sort({ created_at: -1 })
            .limit(5);

        if (ShipmentData && ShipmentData.length !== 0) {
            ShipmentData = ShipmentData.map((shipment) => shipment.toObject());

            // Fetch driver data for each shipment that has a driver_id
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
            data: { Users, Shipment, statusCounts, ShipmentData },
        });
    } catch (error) {
        console.error("Error occurred:", error);
        errorResponse(res, error.message || "Failed to fetch profile", 500);
    }
});

// Broker, carrier, driver dashboard
exports.DashboardApi = catchAsync(async (req, res) => {
    try {
        const { user } = req;

        const shipperId = new mongoose.Types.ObjectId(user.id);
        let filter = {};
        if (user?.role === "broker") {
            filter = { broker_id: shipperId };
        } else if (user?.role === "carrier") {
            filter = { carrier_id: shipperId };
        } else {
            filter = { driver_id: shipperId };
        }

        // Fetch count and data in parallel
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
                .limit(5),
        ]);

        if (ShipmentData && ShipmentData.length !== 0) {
            ShipmentData = ShipmentData.map((shipment) => shipment.toObject());

            // Fetch driver data for each shipment that has a driver_id
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
            data: { Shipment, statusCounts, ShipmentData },
        });
    } catch (error) {
        console.error("Error occurred:", error);
        errorResponse(res, error.message || "Failed to fetch profile", 500);
    }
});

// Customer dashboard
exports.DashboardCustomerApi = catchAsync(async (req, res) => {
    try {
        // Ensure req.user.id is converted correctly to ObjectId
        const customerId = new mongoose.Types.ObjectId(req.user.id);

        const Shipment = await shipment.countDocuments({ customer_id: customerId });

        const statusCounts = await shipment.aggregate([
            { $match: { customer_id: customerId } },
            { $group: { _id: "$status", count: { $sum: 1 } } },
        ]);

        let ShipmentData = await shipment
            .find({ customer_id: customerId })
            .populate([
                { path: "broker_id", select: "name email" },
                { path: "shipper_id", select: "name email" },
                { path: "customer_id", select: "name email" },
                { path: "driver_id", select: "name email" },
                { path: "carrier_id", select: "name email" },
            ])
            .sort({ created_at: -1 }) // Ensure created_at exists in schema
            .limit(5);

        if (ShipmentData && ShipmentData.length !== 0) {
            ShipmentData = ShipmentData.map((shipment) => shipment.toObject());

            // Fetch driver data for each shipment that has a driver_id
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
            data: { Shipment, statusCounts, ShipmentData },
        });
    } catch (error) {
        console.error("Error occurred:", error);
        errorResponse(res, error.message || "Failed to fetch profile", 500);
    }
});

// Admin Dashboard
exports.DashboardAdminApi = catchAsync(async (req, res) => {
    try {
        const Users = await User.aggregate([
            { $group: { _id: "$role", count: { $sum: 1 } } },
        ]);

        const Shipment = await shipment.countDocuments();

        const statusCounts = await shipment.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } },
        ]);

        let ShipmentData = await shipment
            .find()
            .populate([
                { path: "broker_id", select: "name email" },
                { path: "shipper_id", select: "name email" },
                { path: "customer_id", select: "name email" },
                { path: "driver_id", select: "name email" },
                { path: "carrier_id", select: "name email" },
            ])
            .sort({ created_at: -1 }) // Ensure created_at exists in schema
            .limit(5);

        if (ShipmentData && ShipmentData.length !== 0) {
            ShipmentData = ShipmentData.map((shipment) => shipment.toObject());

            // Fetch driver data for each shipment that has a driver_id
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
            data: { Users, Shipment, statusCounts, ShipmentData },
        });
    } catch (error) {
        console.error("Error occurred:", error);
        errorResponse(res, error.message || "Failed to fetch profile", 500);
    }
});