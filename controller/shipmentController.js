const PDFDocument = require('pdfkit');
const pdf = require("html-pdf-node");
const Shipment = require("../model/shipment");
const Driver = require("../model/driver.js");
const { validationErrorResponse, errorResponse, successResponse, } = require("../utils/ErrorHandling");
const catchAsync = require("../utils/catchAsync");
const notification = require("../model/Notification")
const BOL = require("../Email/bol.js");
const { createNotification, updateNotification, updateStatusNotification, updateReviewNotification } = require('./Notification.js'); // Import the Notification function
const { AddDirection } = require('./directionsController.js');
const { deleteFile } = require('../utils/S3.js');

exports.createShipment = catchAsync(async (req, res) => {
  try {
    const requiredFields = [
      "name",
      "description",
      "pickup_location",
      "drop_location",
      "customer_id",
      "broker_id",
      "shippingDate",
      "deliveryDateExpect",
      "cost",
      "paymentStatus",
      "quantity",
      "weight",
      "dimensions",
      "typeOfGoods",
      "current_location"
    ];
    // Check for missing required fields
    const missingFields = requiredFields.filter((field) => !req.body[field]);
    const shipper_id = req?.user?.id || null;

    if (missingFields.length > 0) {
      return errorResponse(
        res,
        `All fields are required`,
        400,
        false
      );
    }


    const shipmentData = {};
    const schemaFields = Object.keys(Shipment.schema.paths);

    schemaFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        shipmentData[field] = req.body[field];
      }
    });
    shipmentData.shipper_id = shipper_id;
    console.log("req.file", req.file);
    const fileUrl = req?.file?.location || null;
    if (fileUrl) {
      shipmentData.uploadedBol = fileUrl;
    }
    const shipment = await Shipment.create(shipmentData);
    await createNotification({
      body: {
        senderId: shipper_id,
        receiverBrokerId: [shipment.broker_id].map(id => ({ Receiver: id })),
        receiverCustomerId: [shipment.customer_id].map(id => ({ Receiver: id })),
        ShipmentId: shipment._id,
      },
    });

    await AddDirection({
      body: {
        pickup_location: shipment.pickup_location,
        drop_location: shipment.drop_location,
        current_location: shipment.pickup_location,
        Shipment_id: shipment._id,
      },
    });
    return successResponse(
      res,
      "Shipment created successfully",
      201,
      shipment
    );
  } catch (error) {
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

exports.updateShipment = catchAsync(async (req, res) => {
  try {
    const updateData = req.body;
    console.log("req.file",req.file);
    console.log("body",req?.body);
    return successResponse(res, "Consoled successfully", 200);
    if (!updateData || Object.keys(updateData).length === 0) {
      return errorResponse(res, "No data provided to update", 400, false);
    }
    const shipment = await Shipment.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );
    if (!shipment) {
      return errorResponse(res, "Shipment not found", 404, false);
    }
    if (updateData?.broker_id) {
      await updateStatusNotification({
        body: {
          senderId: shipment.shipper_id,
          receiverBrokerId: updateData.broker_id,
          receiverCustomerId: updateData.customer_id,
          ShipmentId: shipment._id,
          status: false,
        },
      })
    }
    if (updateData.carrier_id) {
      await updateNotification({
        body: {
          senderId: shipment.shipper_id,
          ShipmentId: shipment._id,
          receiverCarrierId: updateData.carrier_id,
          receiverDriverId: updateData.driver_id,
          receiverBrokerId: shipment.broker_id,
          receiverCustomerId: shipment.customer_id,
          ShipmentId: shipment._id,
        },
      });
    }
    if (updateData.driver_id) {
      await updateNotification({
        body: {
          senderId: shipment.shipper_id,
          ShipmentId: shipment._id,
          receiverCarrierId: updateData.carrier_id,
          receiverDriverId: updateData.driver_id,
          receiverBrokerId: shipment.broker_id,
          receiverCustomerId: shipment.customer_id,
          ShipmentId: shipment._id,
        },
      });
    }
    if (updateData.review) {
      await updateReviewNotification({
        body: {
          senderId: shipment.shipper_id,
          ShipmentId: shipment._id,
          receiverCarrierId: shipment.carrier_id,
          receiverBrokerId: shipment.broker_id,
          receiverDriverId: shipment.driver_id,
          receiverShipperId: shipment.shipper_id,
        },
      })
    }

    if (updateData.carrier_id) {
      return successResponse(res, "Carrier Assigned successfully", 200, shipment);
    }

    if (updateData.review) {
      return successResponse(res, "Review Add successfully", 200, shipment);
    }

    if (updateData.driver_id) {
      return successResponse(res, "Driver Assigned successfully", 200, shipment);
    }
    if (updateData.customer_id) {
      return successResponse(res, "Shipment Update successfully", 200, shipment);
    }
  } catch (error) {
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

exports.dispatchSheet = catchAsync(async (req, res) => {
  try {
    const { carrier_id, broker_approve } = req.body;
    const fileUrl = req?.file?.location;

    // If no valid data is provided, return an error
    if (!carrier_id && !fileUrl && broker_approve === undefined) {
      return errorResponse(res, "Invalid request: No valid update fields provided", 400, false);
    }

    let updateData = {},text="";

    // Case 1: Both carrier_id and fileUrl are provided
    if (carrier_id && fileUrl) {
      updateData = { carrier_id, broker_dispatch_sheet: fileUrl };
      text="Carrier and dispatch shhet assigned successfully";
    }
    // Case 2: Only fileUrl is provided
    else if (fileUrl) {
      updateData = { carrier_dispatch_sheet: fileUrl };
      text="Dispatch sheet sent back to broker successfully";
    }
    // Case 3: Only broker_approve (boolean) is provided
    else if (broker_approve !== undefined) {
      updateData = { broker_approve };
      text="Dispatch sheet approved successfully";
    }

    // Update the shipment with the appropriate data
    const shipment = await Shipment.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!shipment) {
      return errorResponse(res, "Shipment not found", 404, false);
    }

    return successResponse(res, text, 200, shipment);
  } catch (error) {
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

// exports.updateShipmentData = catchAsync(async (req, res) => {
//   try {
//     const updateData = req.body;
//     if (!updateData || Object.keys(updateData).length === 0) {
//       return errorResponse(res, "No data provided to update", 400, false);
//     }
//     const shipment = await Shipment.findByIdAndUpdate(
//       req.params.id,
//       updateData,
//       {
//         new: true,
//         runValidators: true,
//       }
//     );
//     if (!shipment) {
//       return errorResponse(res, "Shipment not found", 404, false);
//     }
//     return successResponse(res, "Shipment updated successfully", 200, shipment);
//   } catch (error) {
//     return errorResponse(res, error.message || "Internal Server Error", 500);
//   }
// });

exports.deleteShipment = catchAsync(async (req, res) => {
  try {
    const notificationdata = await notification.findOneAndDelete({ ShipmentId: req.params.id });
    if (!notificationdata) {
      return errorResponse(res, "Shipment not found", 404, false);
    }
    const shipment = await Shipment.findByIdAndDelete(req.params.id);
    if(shipment?.uploadedBol)
      {
        const deleteResponse = await deleteFile(shipment.uploadedBol);
        if (!deleteResponse.status) {
          return errorResponse(res, "Failed to delete file from Cloud", 500, false);
        }
      }

    if (!shipment) {
      return errorResponse(res, "Shipment not found", 404, false);
    }

    return successResponse(res, "Shipment deleted successfully", 200, shipment);
  } catch (error) {
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

exports.getShipment = catchAsync(async (req, res) => {
  try {
    const { id } = req.params;
    const query = id ? { _id: id } : {};

    let shipments = await Shipment.find(query).populate([
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

exports.getShipmentofShipper = catchAsync(async (req, res) => {
  try {
    const { status } = req.params;
    let query = { shipper_id: req.user.id };
    if (status !== undefined && status !== "") {
      query.status = status;
    }
    let shipment = await Shipment.find(query).populate([
      { path: "broker_id", select: "name email contact" },
      { path: "shipper_id", select: "name email contact" },
      { path: "customer_id", select: "name email contact" },
      { path: "driver_id", select: "name email contact" },
      { path: "carrier_id", select: "name email contact" }
    ]).sort({ created_at: -1 });
    if (!shipment) {
      return errorResponse(res, "No data found", 404);
    }
    // Convert to an array of plain objects
    shipment = shipment.map((shipment) => shipment.toObject());

    // Fetch driver data for each shipment that has a driver_id
    await Promise.all(
      shipment.map(async (shipment) => {
        if (shipment.driver_id) {
          const driverData = await Driver.findOne({ driver_id_ref: shipment.driver_id._id });
          if (driverData) {
            shipment.driver_id = { ...shipment.driver_id, ...driverData.toObject() };
          }
        }
      })
    );
    return successResponse(res, "Shipment fetched successfully", 200, shipment);
  } catch (error) {
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

exports.getShipmentofBroker = catchAsync(async (req, res) => {
  try {
    const { status } = req.params;
    let query = { broker_id: req.user.id };
    if (status !== undefined && status !== "") {
      query.status = status;
    }
    let shipment = await Shipment.find(query).populate([
      { path: "broker_id", select: "name email contact" },
      { path: "shipper_id", select: "name email contact" },
      { path: "customer_id", select: "name email contact" },
      { path: "driver_id", select: "name email contact" },
      { path: "carrier_id", select: "name email contact" }
    ]).sort({ created_at: -1 });
    if (!shipment) {
      return errorResponse(res, "No data found", 404);
    }
    // Convert to an array of plain objects
    shipment = shipment.map((shipment) => shipment.toObject());

    // Fetch driver data for each shipment that has a driver_id
    await Promise.all(
      shipment.map(async (shipment) => {
        if (shipment.driver_id) {
          const driverData = await Driver.findOne({ driver_id_ref: shipment.driver_id._id });
          if (driverData) {
            shipment.driver_id = { ...shipment.driver_id, ...driverData.toObject() };
          }
        }
      })
    );
    return successResponse(res, "Shipment fetched successfully", 200, shipment);
  } catch (error) {
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

exports.getShipmentofCarrier = catchAsync(async (req, res) => {
  try {
    const { status } = req.params;
    let query = { carrier_id: req.user.id };
    if (status !== undefined && status !== "") {
      query.status = status;
    }
    let shipment = await Shipment.find(query).populate([
      { path: "broker_id", select: "name email contact" },
      { path: "shipper_id", select: "name email contact" },
      { path: "customer_id", select: "name email contact" },
      { path: "driver_id", select: "name email contact" },
      { path: "carrier_id", select: "name email contact" }]
    ).sort({ created_at: -1 });
    if (!shipment) {
      return errorResponse(res, "No data found", 404);
    }
    // Convert to an array of plain objects
    shipment = shipment.map((shipment) => shipment.toObject());

    // Fetch driver data for each shipment that has a driver_id
    await Promise.all(
      shipment.map(async (shipment) => {
        if (shipment.driver_id) {
          const driverData = await Driver.findOne({ driver_id_ref: shipment.driver_id._id });
          if (driverData) {
            shipment.driver_id = { ...shipment.driver_id, ...driverData.toObject() };
          }
        }
      })
    );
    return successResponse(res, "Shipment fetched successfully", 200, shipment);
  } catch (error) {
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

exports.getShipmentofCustomer = catchAsync(async (req, res) => {
  try {
    const { status } = req.params;
    let query = { customer_id: req.user.id };
    if (status !== undefined && status !== "") {
      query.status = status;
    }
    let shipment = await Shipment.find(query).populate([
      { path: "broker_id", select: "name email contact" },
      { path: "shipper_id", select: "name email contact" },
      { path: "customer_id", select: "name email contact" },
      { path: "driver_id", select: "name email contact" },
      { path: "carrier_id", select: "name email contact" }]
    ).sort({ created_at: -1 });
    if (!shipment) {
      return errorResponse(res, "No data found", 404);
    }
    // Convert to an array of plain objects
    shipment = shipment.map((shipment) => shipment.toObject());

    // Fetch driver data for each shipment that has a driver_id
    await Promise.all(
      shipment.map(async (shipment) => {
        if (shipment.driver_id) {
          const driverData = await Driver.findOne({ driver_id_ref: shipment.driver_id._id });
          if (driverData) {
            shipment.driver_id = { ...shipment.driver_id, ...driverData.toObject() };
          }
        }
      })
    );
    return successResponse(res, "Shipment fetched successfully", 200, shipment);
  } catch (error) {
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

exports.getBOL = catchAsync(async (req, res) => {
  try {
    let shipments = await Shipment.findById({ _id: req?.params?.id }).populate([
      { path: "broker_id", select: "-password" },
      { path: "shipper_id", select: "-password" },
      { path: "customer_id", select: "-password" },
      { path: "driver_id", select: "-password" },
      { path: "carrier_id", select: "-password" }
    ]).sort({ created_at: -1 });

    if (!shipments || shipments.length === 0) {
      return errorResponse(res, "No data found", 404);
    }

    // Convert to an array of plain objects
    shipments = shipments.toObject();

    // Fetch driver data for each shipment that has a driver_id
    if (shipments.driver_id) {
      const driverData = await Driver.findOne({ driver_id_ref: shipments.driver_id._id });
      if (driverData) {
        shipments.driver_id = { ...shipments.driver_id, ...driverData.toObject() };
      }
    }
    // return res.json({
    //   status:true,
    //   message:"Data retrieved sucessfully",
    //   data:shipments
    // })

    const BOLHTML = BOL({ shipments });

    const options1 = {
      width: "800px",
      height: "1250px",
      preferCSSPageSize: true,
      printBackground: true,
    };
    const BOLfile = { content: BOLHTML };

    let BOLpdf;
    try {
      BOLpdf = await pdf.generatePdf(BOLfile, options1);
    } catch (error) {
      console.log("error", error);
      return res.status(500).json({
        status: false,
        message: "Failed to generate PDF",
      });
    }

    // Set response headers for PDF download
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=BOL.pdf",
      "Content-Length": BOLpdf.length,
    });

    return res.send(BOLpdf);
  } catch (error) {
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});