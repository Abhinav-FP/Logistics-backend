const PDFDocument = require('pdfkit');
const Shipment = require("../model/shipment");
const {
  validationErrorResponse,
  errorResponse,
  successResponse,
} = require("../utils/ErrorHandling");
const catchAsync = require("../utils/catchAsync");
// const puppeteer = require('puppeteer');
// var Promise = require('bluebird');
// const hb = require('handlebars');
// const BOL = require("../html/bol");

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
const { createNotification, updateNotification } = require('./authController'); // Import the Notification function

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
      body: { senderId: shipper_id, receiverBrokerId: req.body.broker_id, receiverCustomerId: req.body.customer_id, ShipmentId: shipment._id },
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
    await updateNotification({
      body: { senderId: req.user.id, receiverBrokerId: updateData.broker_id, receiverCustomerId: updateData.customer_id, ShipmentId: shipment._id },
    });
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
    console.log("req.user", req.user);
    const { id } = req.params;
    const query = id ? { _id: id } : {};
    const shipment = await Shipment.find(query).populate(
      {
        path: "broker_id",
        select: "email"
      }
    ).populate({
      path: "shipper_id",
      select: "email"
    }).populate({
      path: "customer_id",
      select: "email"
    });
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
    const shipment = await Shipment.find({ broker_id: req.user.id });
    if (!shipment) {
      return errorResponse(res, "No data found", 404);
    }
    return successResponse(res, "Shipment fetched successfully", 200, shipment);
  } catch (error) {
    return errorResponse(res, error.message || "Internal Server Error", 500);
  }
});

// exports.getBOL = catchAsync(async (req, res) => {
//   try {
//     // const doc = new PDFDocument();

//     // // Set headers for the PDF response
//     // res.setHeader('Content-Type', 'application/pdf');
//     // res.setHeader('Content-Disposition', 'attachment; filename="random.pdf"');

//     // // Pipe the PDF directly to the response
//     // doc.pipe(res);

//     // // Add content to the PDF
//     // doc.fontSize(25).text('Bill of Lading (BOL)', {
//     //   align: 'center',
//     // });

//     // doc.moveDown();
//     // doc.fontSize(12).text('This is a randomly generated PDF for demonstration purposes.', {
//     //   align: 'left',
//     // });

//     // doc.moveDown();
//     // doc.text(`Generated on: ${new Date().toLocaleString()}`);

//     // // Finalize the PDF and end the response
//     // doc.end();

// // Random data
//     const name = "John Doe";
//     const description = "Fragile electronics package, handle with care.";
//     const pickup_location = "New York, USA";
//     const drop_location = "Los Angeles, USA";
//     const current_location = "Chicago, USA";
//     const customer_id = "1234567890abcdef12345678";
//     const status = "transit";
//     const shipper_id = "abcdef1234567890abcdef12";
//     const broker_id = "7890abcdef1234567890abcd";
//     const carrier_id = "4567890abcdef123456789abc";
//     const driver_id = "abcdef78901234567890abcd";
//     const shippingDate = "2025-01-15";
//     const deliveryDateExpect = "2025-01-20";
//     const cost = 2500;
//     const paymentStatus = "paid";
//     const quantity = 10;
//     const weight = 25.5; // in kilograms
//     const dimensions = "50x40x30"; // length x width x height in cm
//     const typeOfGoods = "Electronics";
    
//     const BOLHTML = BOL(name,description,pickup_location,drop_location,current_location,customer_id,status,shipper_id,broker_id,carrier_id,driver_id,shippingDate,deliveryDateExpect,cost,paymentStatus,quantity,weight,dimensions,typeOfGoods);    

//   const options1 = {
//     width: "800px", // Custom width
//     height: "968.219px", // Custom height
//     preferCSSPageSize: true, // Uses CSS page size if defined in styles
//     printBackground: true, // Ensures background colors and images are printed
//   };
//   const BOLfile = { content: BOLHTML };

//   // Invoice
//   let BOLpdf;
//   try {
//     BOLpdf = await generatePdf(BOLfile, options1);
//   } catch (error) {
//     console.log("error",error);
//     logger.error("error",error);
//     return res.status(500).json({
//       status: false,
//       message: "Failed to generate PDF",
//     });
//   }
//   return res.status(200).json({
//     status: true,
//     message: "PDF generated successfully",
//     data: BOLpdf,
//   });
//   } catch (error) {
//     return errorResponse(res, error.message || 'Internal Server Error', 500);
//   }
// });