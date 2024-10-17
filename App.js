const dotenv = require("dotenv");
const  UserRoute = require("./route/UserRoute")
const enauiryroute  =require("./route/Enquiry")
const packageroute  =require("./route/Package")
const bookingroute = require("./route/Booking")

require("./dbconfigration");
dotenv.config();

const express = require("express");
const multer = require("multer"); 
const app = express();
const cors = require("cors");


const corsOptions = {
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '2000mb' }));
app.use(express.urlencoded({ extended: true }));

app.use("/user", UserRoute)

app.use("/enquiry" ,enauiryroute)

app.use("/package", packageroute)

app.use("/booking", bookingroute)

upload = multer();
app.use(upload.none()); 



const PORT = process.env.REACT_APP_SERVER_DOMIN;

app.get("/", (req, res) => {
  res.json({
    msg: 'Okay',
    status: 200,
  });
});

app.listen(PORT, () => console.log("Server is running at port : " + PORT));
