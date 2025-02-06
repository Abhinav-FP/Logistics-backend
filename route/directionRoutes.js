const express = require('express');
const router = express.Router();
const directionsController = require('../controller/directionsController');

// Route to fetch directions
router.post('/directions', directionsController.AddDirection);

router.get("/get_direction/:uuid", directionsController.getDirectionByUuid)



module.exports = router;
