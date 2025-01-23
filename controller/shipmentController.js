const PDFDocument = require('pdfkit');
const Shipment = require("../model/shipment");
const {
  validationErrorResponse,
  errorResponse,
  successResponse,
} = require("../utils/ErrorHandling");
const catchAsync = require("../utils/catchAsync");


exports.createShipment = catchAsync(async (req, res) => {
  try {
    // console.log("req.body", req.body);

    // Define required fields based on the schema
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

    const shipment = await Shipment.create(shipmentData);

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

    return successResponse(res, "Shipment updated successfully", 200, shipment);
  } catch (error) {
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

exports.deleteShipment = catchAsync(async (req, res) => {
  try {
    const shipment = await Shipment.findByIdAndDelete(req.params.id);

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
    console.log("req.user",req.user);
    const { id } = req.params;
    const query = id ? { _id: id } : {};
    const shipment = await Shipment.find(query); 
    if (!shipment) {
      return errorResponse(res, "No data found", 404);
    }
    return successResponse(res, "Shipment fetched successfully", 200, shipment);
  } catch (error) {
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

exports.getShipmentofBroker = catchAsync(async (req, res) => {
  try {
    const shipment = await Shipment.find({broker_id: req.user.id}); 
    if (!shipment) {
      return errorResponse(res, "No data found", 404);
    }
    return successResponse(res, "Shipment fetched successfully", 200, shipment);
  } catch (error) {
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

exports.getBOL = catchAsync(async (req, res) => {
  try {
    // Create a new PDF document
    const doc = new PDFDocument();

    // Set headers for the PDF response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="random.pdf"');

    // Pipe the PDF directly to the response
    doc.pipe(res);

    // Add content to the PDF
    doc.fontSize(25).text('Bill of Lading (BOL)', {
      align: 'center',
    });

    doc.moveDown();
    doc.fontSize(12).text('This is a randomly generated PDF for demonstration purposes.', {
      align: 'left',
    });

    doc.moveDown();
    doc.text(`Generated on: ${new Date().toLocaleString()}`);

    // Finalize the PDF and end the response
    doc.end();
  } catch (error) {
    return errorResponse(res, error.message || 'Internal Server Error', 500);
  }
});