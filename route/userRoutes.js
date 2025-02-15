const router = require("express").Router();
const { signup, login, createAccount, getUsers, profilegettoken, createCarrier, createCustomer, GetCoustomer, getCarrier, createDriver, getDriver, resetPassword } = require("../controller/authController");
const { DashboardApi, DashboardShipperApi, DashboardAdminApi, DashboardCustomerApi } = require("../controller/Dashboardcontroller");
const { MarkNotificationAsRead, NotificationGet } = require("../controller/Notification");
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

router.get("/cous", verifyToken, GetCoustomer);

router.get("/get-role", verifyToken, profilegettoken);

router.get("/get-notification", verifyToken, NotificationGet);

router.post("/read-notification", verifyToken, MarkNotificationAsRead);

router.get("/dashboard/shipper", verifyToken, DashboardShipperApi);

router.get("/dashboard/customer", verifyToken, DashboardCustomerApi);

router.get("/dashboard/admin", verifyToken, DashboardAdminApi);

router.get("/dashboard", verifyToken, DashboardApi);


module.exports = router;