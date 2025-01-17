const router = require("express").Router();
const {  createAccount } = require("../controller/authController");
const {checkPermission} = require('../middleware/rbacMiddleware');
const {verifyToken} = require('../middleware/tokenVerify');

router.post("/create",verifyToken, checkPermission('create-shipment'), createAccount);

module.exports = router;