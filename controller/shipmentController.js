const PDFDocument = require('pdfkit');
const pdf = require("html-pdf-node");
const Shipment = require("../model/shipment");
const { validationErrorResponse, errorResponse,successResponse,} = require("../utils/ErrorHandling");
const catchAsync = require("../utils/catchAsync");
const notification  = require("../model/Notification")
const BOL = require("../Email/bol.js");
const { createNotification, updateNotification ,updateStatusNotification } = require('./authController'); // Import the Notification function
// const puppeteer = require('puppeteer');
// var Promise = require('bluebird');
// const hb = require('handlebars');

// // PDF Generator function, edit it carefully
// async function generatePdf(file, options, callback) {
//   // we are using headless mode
//   let args = [
//     '--no-sandbox',
//     '--disable-setuid-sandbox',
//   ];
//   if(options.args) {
//     args = options.args;
//     delete options.args;
//   }

//   const browser = await puppeteer.launch({
//     executablePath: '/usr/bin/google-chrome-stable', // Path to the installed Chromium
//     args: ['--no-sandbox', '--disable-setuid-sandbox'], // Avoid sandboxing issues in Docker
//   });
//   const page = await browser.newPage();

//   if(file.content) {
//     console.log("Compiling the template with handlebars")
//     // we have compile our code with handlebars
//     const template = hb.compile(file.content, { strict: true });
//     const result = template(file.content);
//     const html = result;

//     // We set the page content as the generated html by handlebars
//     await page.setContent(html);
//   } else {
//     await page.goto(file.url, {
//       waitUntil: 'networkidle0', // wait for page to load completely
//     });
//   }

//   return Promise.props(page.pdf(options))
//     .then(async function(data) {
//        await browser.close();

//        return Buffer.from(Object.values(data));
//     }).asCallback(callback);
// }
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
    await createNotification({
      body: {
        senderId: shipper_id,
        receiverBrokerId: [req.body.broker_id].map(id => ({ Receiver: id })),
        receiverCustomerId: [req.body.customer_id].map(id => ({ Receiver: id })),
        ShipmentId: shipment._id,
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
    await updateStatusNotification({
      body: {
        senderId: shipment.shipper_id,
        receiverBrokerId: updateData.broker_id,
        receiverCustomerId: updateData.customer_id,
        ShipmentId: shipment._id,
        status: false,
      },
    })
    await updateNotification({
      body: {
        senderId: shipment.shipper_id,
        ShipmentId: shipment._id,
        receiverCarrierId : updateData.carrier_id ,
        receiverDriverId: updateData.driver_id,
        ShipmentId: shipment._id,
      },
    });

    return successResponse(res, "Shipment updated successfully", 200, shipment);
  } catch (error) {
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

exports.deleteShipment = catchAsync(async (req, res) => {
  try {
    const notificationdata = await notification.findOneAndDelete({ ShipmentId: req.params.id });
    if ( !notificationdata) {
      return errorResponse(res, "Shipment not found", 404, false);
    }
    const shipment = await Shipment.findByIdAndDelete(req.params.id);

    if (!shipment ) {
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
    const shipment = await Shipment.find(query).populate([
      { path: "broker_id", select: "name email" },
      { path: "shipper_id", select: "name email"},
      { path: "customer_id", select:"name email" },
      { path: "driver_id", select: "name email" },
      { path: "carrier_id", select: "name email" }
    ]);
    
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
    const shipment = await Shipment.find({ broker_id: req.user.id }).populate([
      { path: "carrier_id", select: "name email" }
    ]);
    if (!shipment) {
      return errorResponse(res, "No data found", 404);
    }
    return successResponse(res, "Shipment fetched successfully", 200, shipment);
  } catch (error) {
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

exports.getShipmentofCarrier = catchAsync(async (req, res) => {
  try {
    const shipment = await Shipment.find({ carrier_id: req.user.id }).populate(
      { path: "driver_id", select: "name email" }
    );
    if (!shipment) {
      return errorResponse(res, "No data found", 404);
    }
    return successResponse(res, "Shipment fetched successfully", 200, shipment);
  } catch (error) {
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

exports.getShipmentofCustomer = catchAsync(async (req, res) => {
  try {
    const shipment = await Shipment.find({ customer_id: req.user.id }).populate(
      { path: "customer_id", select: "name email" }
    );
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
    // Random data
    const name = "John Doe";
    const description = "Fragile electronics package, handle with care.";
    const pickup_location = "New York, USA";
    const drop_location = "Los Angeles, USA";
    const current_location = "Chicago, USA";
    const customer_id = "1234567890abcdef12345678";
    const status = "transit";
    const shipper_id = "abcdef1234567890abcdef12";
    const broker_id = "7890abcdef1234567890abcd";
    const carrier_id = "4567890abcdef123456789abc";
    const driver_id = "abcdef78901234567890abcd";
    const shippingDate = "2025-01-15";
    const deliveryDateExpect = "2025-01-20";
    const cost = 2500;
    const paymentStatus = "paid";
    const quantity = 10;
    const weight = 25.5; // in kilograms
    const dimensions = "50x40x30"; // length x width x height in cm
    const typeOfGoods = "Electronics";

    const BOLHTML = BOL(
      name,
      description,
      pickup_location,
      drop_location,
      current_location,
      customer_id,
      status,
      shipper_id,
      broker_id,
      carrier_id,
      driver_id,
      shippingDate,
      deliveryDateExpect,
      cost,
      paymentStatus,
      quantity,
      weight,
      dimensions,
      typeOfGoods
    );

    const options1 = {
      width: "800px",
      height: "968.219px",
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