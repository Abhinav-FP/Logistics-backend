const PDFDocument = require('pdfkit');
const pdf = require("html-pdf-node");
const Shipment = require("../model/shipment");
const Driver = require("../model/driver.js");
const { errorResponse, successResponse, } = require("../utils/ErrorHandling");
const catchAsync = require("../utils/catchAsync");
const notification = require("../model/Notification")
const BOL = require("../Email/bol.js");
const { createNotification } = require('./Notification.js'); // Import the Notification function
const { AddDirection } = require('./directionsController.js');
const { deleteFile } = require('../utils/S3.js');

// Qr code generator code
const QRCode = require('qrcode');
const { PassThrough } = require('stream');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { S3Client } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});
// Define the UPLOADS_FOLDER
const UPLOADS_FOLDER = "uploads/";

const generateAndUploadQRCode = async (url) => {
    try {
        // Generate QR code as a Buffer
        const qrCodeImage = await QRCode.toBuffer(url);

        // Convert the image to a readable stream for S3 upload
        const qrStream = new PassThrough();
        qrStream.end(qrCodeImage);

        // Define the key for the uploaded QR code image
        const key = `${UPLOADS_FOLDER}${Date.now().toString()}-QRCode.png`;

        const uploadParams = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: key,
            Body: qrCodeImage, // Directly upload the Buffer
            ContentType: 'image/png',
            ContentDisposition: 'inline',
        };

        // Upload QR code image to S3
        const command = new PutObjectCommand(uploadParams);
        await s3Client.send(command);

        // Construct the S3 file URL
        const s3Url = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
        return s3Url;
    } catch (err) {
        console.error('Error generating or uploading QR code:', err);
        return "Error generating or uploading QR code";    }
};

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
    // console.log("req.file", req.file);
    const fileUrl = req?.file?.location || null;
    if (fileUrl) {
      shipmentData.uploadedBol = fileUrl;
    }
    const shipment = await Shipment.create(shipmentData);
    await createNotification({
      body: {
        ReciverId:shipment.broker_id,
        SenderId: shipment.shipper_id ,
        ShipmentId: shipment._id,
        text: "A new shipment has been assigned to you."
      },
    });
    await createNotification({
      body: {
        ReciverId: shipment.customer_id,
        SenderId: shipment.shipper_id,
        ShipmentId: shipment._id,
        text: "A new shipment has been created for you."
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
      await createNotification({
        body: {
          senderId: shipment?.shipper_id,
          ReciverId: shipment.carrier_id,
          SenderId: shipment.broker_id,
          ShipmentId: shipment._id,
          text : "A new shipment has been assigned to you."
        },
      });
    }
    if (updateData.carrier_id) {
      await createNotification({
        body: {
          senderId: shipper_id,
          ReciverId: shipment.customer_id,
          SenderId: shipment.broker_id,
          ShipmentId: shipment._id,
          text : "A new shipment has been assigned to you."
        },
      });
    }
    if (updateData.driver_id) {
      const result = await generateAndUploadQRCode(`https://tracebill.com/users/review/${req.params.id}`);
      const shipments = await Shipment.findByIdAndUpdate(
        req.params.id,
        {qrcode:result},
        {
          new: true,
          runValidators: true,
        }
      );
      await createNotification({
        body: {
          SenderId: shipment.carrier_id,
          ReciverId: shipment.driver_id,
          ShipmentId: shipment._id,
          text :"A new shipment has been assigned to you."
        },
      });
    }
    if (updateData.review) {
      await createNotification({
        body: {
          ReciverId: shipment.driver_id,
          SenderId: shipment.customer_id,
          ShipmentId: shipment._id,
          text : "The User has added a review"
        },
      });
      await createNotification({
        body: {
          ReciverId: shipment.broker_id,
          SenderId: shipment.customer_id,
          ShipmentId: shipment._id,
          text : "The User has added a review"

        },
      });
      await createNotification({
        body: {
          ReciverId: shipment.carrier_id,
          SenderId: shipment.customer_id,
          ShipmentId: shipment._id,
          text : "The User has added a review"

        },
      });
      await createNotification({
        body: {
          ReciverId: shipment.shipper_id,
          SenderId: shipment.customer_id,
          ShipmentId: shipment._id,
          text : "The User has added a review"

        },
      });
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

    let updateData = {},text="" ,text1 ="" , text2="" ;

    // Case 1: Both carrier_id and fileUrl are provided
    if (carrier_id && fileUrl) {
      updateData = { carrier_id, broker_dispatch_sheet: fileUrl };
      text="Carrier and dispatch sheet assigned successfully";
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

    if (carrier_id && fileUrl) {
      updateData = { carrier_id, broker_dispatch_sheet: fileUrl };
      text1="The Broker has assigned a dispatch sheet to you.";
      await createNotification({
        body: {
          senderId: shipment.shipper_id,
          ReciverId: shipment.carrier_id,
          SenderId: shipment.broker_id,
          ShipmentId: shipment._id,
          text : text1
        },
      });
      
    }
    // Case 2: Only fileUrl is provided
    else if (fileUrl) {
      updateData = { carrier_dispatch_sheet: fileUrl };
      text2="The Carrier has sent back the dispatch sheet to you.";
      await createNotification({
        body: {
          senderId: shipment.shipper_id,
          ReciverId: shipment.broker_id,
          SenderId: shipment.carrier_id,
          ShipmentId: shipment._id,
          text : text2
        },
      });
    }
    // Case 3: Only broker_approve (boolean) is provided
    else if (broker_approve !== undefined) {
      updateData = { broker_approve };
      text1 ="Dispatch sheet has been approved by the broker.";
      await createNotification({
        body: {
          senderId: shipment.shipper_id,
          ReciverId: shipment.carrier_id,
          SenderId: shipment.broker_id,
          ShipmentId: shipment._id,
          text : text1
        },
      });
    }
    if (!shipment) {
      return errorResponse(res, "Shipment not found", 404, false);
    }

    return successResponse(res, text, 200, shipment);
  } catch (error) {
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

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
