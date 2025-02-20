const express = require('express');
const router = express.Router();
const Appcontroller = require('../controller/Appcontroller');
const { verifyToken } = require('../middleware/tokenVerify');
const { upload } = require('../utils/S3'); // Import multer from S3.js
const { getBOL } = require('../controller/shipmentController');

// Route to fetch directions
router.post('/driver', verifyToken, Appcontroller.UpdateDriver);
router.get("/get_driver", verifyToken, Appcontroller.GetDrivers);
router.get("/shipment", verifyToken, Appcontroller.ShipmentGet);
router.get("/shipment_detail/:id", verifyToken, Appcontroller.getShipmentDetilas);
router.post("/forget_email", Appcontroller.forgotlinkrecord);
router.post("/forget_password", Appcontroller.forgotpassword);
router.post("/forget_otp", Appcontroller.forgotOTP);
router.post("/login", Appcontroller.login);
router.get("/get-notification", verifyToken, Appcontroller.NotificationDriverGet);
router.post("/read-notification", verifyToken, Appcontroller.MarkNotificationAsRead);
router.post("/update_direction", Appcontroller.updateDirections);
router.get("/shipment_update/:id", Appcontroller.updateShipmentData);
router.get("/driver_reached/:id", Appcontroller.DriverReached);
router.post("/shipment_sign/:id", upload.single('file'), Appcontroller.updateShipmentSign);
router.get("/dashboard", verifyToken, Appcontroller.DashboardDriverApi);
router.get("/bols/:id", getBOL);


module.exports = router;
