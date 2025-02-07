const dotenv = require("dotenv");
dotenv.config();

require("./dbconfigration");
const express = require("express");
const app = express();
const cors = require("cors");
const corsOptions = {
  origin: "*", // Allowed origins
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: '*', // Allow all headers
  credentials: true,
  optionsSuccessStatus: 200, // for legacy browsers
}

// const logger = require("./utils/Logger");

const UserRoute = require("./route/userRoutes");
const ShipmentRoute = require("./route/shipmentRoutes");
const PlaceRoute = require("./route/directionRoutes");
const Approute =require("./route/AppRoute")


app.use(cors(corsOptions));
app.use(express.json({ limit: '2000mb' }));
app.use(express.urlencoded({ extended: true }));

app.use("/user", UserRoute);
app.use("/shipment", ShipmentRoute);
app.use("/place" ,PlaceRoute)
app.use("/app" , Approute)

const PORT = process.env.REACT_APP_SERVER_DOMIN;

app.get("/", (req, res) => {
  res.json({
    msg: 'Hello World',
    status: 200,
  });
});

// S3 code begins here
const { S3Client, DeleteObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');
require('aws-sdk/lib/maintenance_mode_message').suppress = true;

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const upload = multer({
  storage: multerS3({
      s3: s3Client,
      bucket: process.env.S3_BUCKET_NAME,
      contentType: multerS3.AUTO_CONTENT_TYPE, // Set the correct MIME type for the file
      metadata: function (req, file, cb) {
          cb(null, { fieldName: file.fieldname });
      },
      key: function (req, file, cb) {
          cb(null, Date.now().toString() + '-' + file.originalname.replaceAll(" ",""));
      },
      contentDisposition: 'inline', // Ensure files open in the browser
  }),
}); 

app.post('/upload', upload.single('file'), (req, res) => {
  res.status(200).json({
      status:true,
      message: 'File uploaded successfully',
      fileUrl: req.file.location,
  });
});

app.post('/delete', async (req, res) => {
  const fileUrl = req.body.fileUrl;
  const bucketName = process.env.S3_BUCKET_NAME;

  // Extract the key from the file URL
  const key = decodeURIComponent(fileUrl.split(`https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/`)[1]);
  console.log('Extracted Key:', key);

  if (!key) {
      return res.status(400).json({ message: 'Invalid file URL' });
  }

  try {
      // Check if the file exists before attempting deletion
      await s3Client.send(new HeadObjectCommand({ Bucket: bucketName, Key: key }));

      // File exists, proceed with deletion
      await s3Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }));

      res.status(200).json({ message: 'File deleted successfully' });
  } catch (error) {
      if (error.name === 'NotFound') {
          return res.status(404).json({ message: 'File not found' });
      }
      console.error('Error deleting file:', error);
      res.status(500).json({ message: 'Error deleting file', error: error.message });
  }
});
// S3 code ends here


const server = app.listen(PORT, () => console.log("Server is running at port : " + PORT));
server.timeout = 360000; // 6 minutes