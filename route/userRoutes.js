const router = require("express").Router();
const { signup, login, check } = require("../controller/authController");
const {checkPermission} = require('../middleware/rbacMiddleware');
const {verifyToken} = require('../middleware/tokenVerify');

router.post("/signup", signup);
router.post("/login", login);
// Admin route for creating user
router.post("/create-user",verifyToken, checkPermission('create_user'), login);
// The below route is only for checking role based access
router.get("/check",verifyToken, checkPermission('read_record'), check);

module.exports = router;