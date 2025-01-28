const router = require("express").Router();
const { updateShipment, getShipment, getBOL, createShipment, deleteShipment, getShipmentofBroker } = require("../controller/shipmentController");
const {checkPermission} = require('../middleware/rbacMiddleware');
const {verifyToken} = require('../middleware/tokenVerify');

router.post("/create",verifyToken, checkPermission('create-shipment'), createShipment);
router.post("/update/:id",verifyToken, checkPermission('update-shipment'), updateShipment);
router.get("/delete/:id",verifyToken, checkPermission('update-shipment'), deleteShipment);
router.get("/get/:id?",verifyToken, checkPermission('view-shipment'), getShipment);
router.get("/get-shipment-broker",verifyToken, checkPermission('view-shipment'), getShipmentofBroker);
// router.get("/get-bol",verifyToken, checkPermission('view-shipment'), getBOL);

module.exports = router;