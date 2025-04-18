const router = require("express").Router();
const { updateShipment, getShipment, getBOL, createShipment, deleteShipment, getShipmentofBroker, getShipmentofCarrier, getShipmentofCustomer, getShipmentofShipper, dispatchSheet } = require("../controller/shipmentController");
const { checkPermission } = require('../middleware/rbacMiddleware');
const { verifyToken } = require('../middleware/tokenVerify');
const { upload } = require("../utils/S3");

router.post("/create", verifyToken, checkPermission('create-shipment'), upload.single('file'), createShipment);
router.post("/update/:id", verifyToken, checkPermission('update-shipment'), updateShipment);
router.post("/update-sheet/:id", verifyToken, checkPermission('update-shipment'), upload.single('file'), dispatchSheet);
// router.post("/update-review/:id", verifyToken, checkPermission('update-shipment'), upload.single('file'), UpdateReview);
// router.post("/shipment_update/:id", verifyToken, checkPermission('update-shipment'), updateShipmentData);

router.get("/delete/:id", verifyToken, checkPermission('update-shipment'), deleteShipment);
router.get("/get/:id?", verifyToken, checkPermission('view-shipment'), getShipment);
router.get("/get-shipment-shipper/:status?", verifyToken, checkPermission('view-shipment'), getShipmentofShipper);
router.get("/get-shipment-broker/:status?", verifyToken, checkPermission('view-shipment'), getShipmentofBroker);
router.get("/get-shipment-carrier/:status?", verifyToken, checkPermission('view-shipment'), getShipmentofCarrier);
router.get("/get-shipment-customer/:status?", verifyToken, checkPermission('view-shipment'), getShipmentofCustomer);
// router.get("/get-bol",verifyToken, checkPermission('view-shipment'), getBOL);
router.get("/get-bol/:id", getBOL);

module.exports = router;