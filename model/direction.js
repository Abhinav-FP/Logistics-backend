const mongoose = require("mongoose");


const directionschema = mongoose.Schema({
    StartLocation: {
        type: Object,
        required: true
    },
    CurrentLocation: {
        type: Object,
        required: true
    },
    EndLocation: {
        type: Object,
        required: true
    },
    routeDetails: {
        type: Object,

    }
})

const directionmodels = mongoose.model("direction", directionschema);

module.exports = directionmodels; 