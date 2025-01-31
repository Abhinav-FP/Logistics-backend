const router = require("express").Router();
const { signup, login, createAccount, getUsers, profilegettoken, createCarrier, createCustomer, getCarrier, createDriver, getDriver, NotificationGet, MarkNotificationAsRead, resetPassword, DashboardApi, forgotlinkrecord ,forgotpassword } = require("../controller/authController");
const { checkPermission } = require('../middleware/rbacMiddleware');
const { verifyToken } = require('../middleware/tokenVerify');
router.post("/signup", signup);
router.post("/login", login);

// Route for creating account
router.post("/create-account", verifyToken, checkPermission('create_account'), createAccount);
router.post("/create-carrier", verifyToken, checkPermission('create_account'), createCarrier);
router.post("/create-customer", verifyToken, checkPermission('create_account'), createCustomer);
router.post("/create-driver", verifyToken, checkPermission('create_account'), createDriver);

router.post("/reset-password", verifyToken, resetPassword);

router.get("/get-carrier", verifyToken, getCarrier);
router.get("/get-driver", verifyToken, getDriver);
router.get("/get/:type?", verifyToken, getUsers);

router.get("/get-role", verifyToken, profilegettoken);

router.get("/get-notification", verifyToken, NotificationGet);


router.post("/read-notification", verifyToken, MarkNotificationAsRead);

router.get("/dashboard", DashboardApi);

router.post("/forget_Email" , forgotlinkrecord);

router.post("/forget_password" , forgotpassword)



module.exports = router;