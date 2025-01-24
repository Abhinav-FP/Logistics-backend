const express = require('express');
const router = express.Router();
const directionsController = require('../controller/directionsController');

// Route to fetch directions
router.post('/directions', directionsController.getDirections);

module.exports = router;
