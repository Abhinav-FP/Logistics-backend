const router = require("express").Router();
const { signup, login, createAccount, getUsers, profilegettoken } = require("../controller/authController");
const {checkPermission} = require('../middleware/rbacMiddleware');
const {verifyToken} = require('../middleware/tokenVerify');

router.post("/signup", signup);
router.post("/login", login);

// Route for creating account
router.post("/create-account",verifyToken, checkPermission('create_account'), createAccount);

router.get("/get/:type?",verifyToken, getUsers);

router.get("/get-role",verifyToken, profilegettoken);

module.exports = router;