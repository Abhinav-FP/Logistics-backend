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
    const {
      name,
      description,
      pickup_location,
      drop_location,
      customer_id,
      status,
      shipper_id,
      broker_id,
      cost,
    } = req.body;

    // Validate required fields
    if (!name || !description || !pickup_location || !drop_location || !customer_id || 
      !shipper_id || !broker_id || !cost ) {
      return errorResponse(res,"All required fields must be provided",400,false);
    }

    // Create a new shipment document
    const shipment = await Shipment.create({
      name,
      description,
      pickup_location,
      drop_location,
      customer_id,
      status: status || "pending",
      shipper_id,
      broker_id,
      cost,
    });

    // Respond with success
    return successResponse(res, "Shipment created successfully", 201, shipment);
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

exports.getShipment = catchAsync(async (req, res) => {
  try {
    // const { type } = req.params;
    // const query = type ? { role: type } : {};
    const shipment = await Shipment.find(); // Find shipment by ID
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