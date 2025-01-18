const router = require("express").Router();
const {  createAccount } = require("../controller/authController");
const { updateShipment, getShipment } = require("../controller/shipmentController");
const {checkPermission} = require('../middleware/rbacMiddleware');
const {verifyToken} = require('../middleware/tokenVerify');

router.post("/create",verifyToken, checkPermission('create-shipment'), createAccount);
router.post("/update/:id",verifyToken, checkPermission('update-shipment'), updateShipment);
router.get("/get",verifyToken, checkPermission('view-shipment'), getShipment);

module.exports = router;