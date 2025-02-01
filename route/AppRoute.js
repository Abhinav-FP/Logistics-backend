const express = require('express');
const router = express.Router();
const Appcontroller = require('../controller/Appcontroller');
const { verifyToken } = require('../middleware/tokenVerify');

// Route to fetch directions
router.post('/driver', verifyToken , Appcontroller.UpdateDriver);
router.get("/get_driver", verifyToken, Appcontroller.GetDriver);
router.get("/shipment/:driver_id", Appcontroller.ShipmentGet);
router.post("/forget_Email" , Appcontroller.forgotlinkrecord);
router.post("/forget_password" , Appcontroller.forgotpassword);
router.get("/get-notification" ,verifyToken , Appcontroller.NotificationDriverGet);
router.post("/read-notification", verifyToken, Appcontroller.MarkNotificationAsRead);

module.exports = router;
