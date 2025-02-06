const express = require('express');
const router = express.Router();
const Appcontroller = require('../controller/Appcontroller');
const { verifyToken } = require('../middleware/tokenVerify');

// Route to fetch directions
router.post('/driver', verifyToken , Appcontroller.UpdateDriver);
router.get("/get_driver", verifyToken, Appcontroller.GetDrivers);
router.get("/shipment/:driver_id", Appcontroller.ShipmentGet);
router.post("/forget_email" , Appcontroller.forgotlinkrecord);
router.post("/forget_password" , Appcontroller.forgotpassword);
router.post("/forget_otp" , Appcontroller.forgotOTP);
router.post("/login" , Appcontroller.login);

router.get("/get-notification" ,verifyToken , Appcontroller.NotificationDriverGet);
router.post("/read-notification", verifyToken, Appcontroller.MarkNotificationAsRead);
router.post("/update_direction", Appcontroller.updateDirections)
router.get("/shipment_update/:id" , Appcontroller.updateShipmentData)
router.post("/shipment_sign/:id" , Appcontroller.updateShipmentSign)



module.exports = router;
