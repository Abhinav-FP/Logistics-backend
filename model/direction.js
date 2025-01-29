const mongoose = require("mongoose");
const { v4: uuidv4 } = require('uuid');

const directionsSchema = mongoose.Schema({
    StartLocation: {
        lat: {
            type: Number,
            required: true
        },
        lng: {
            type: Number,
            required: true
        },
        distination: {
            type: String,
            required: true
        },
        duration: {
            type: String,
            required: true
        },
        startToEndPolyline: {
            type: String,
            required: true
        },
        created_at: {
            type: Date,
            default: Date.now
        }
    },
    CurrentLocation: [{
        lat: {
            type: Number,
            required: true
        },
        lng: {
            type: Number,
            required: true
        },
        distination: {
            type: String,
            required: true
        },
        duration: {
            type: String,
            required: true
        },
        startToEndPolyline: {
            type: String,
            required: true
        },
        created_at: {
            type: Date,
            default: Date.now
        }
    }],
    EndLocation: {
        lat: {
            type: Number,
            required: true
        },
        lng: {
            type: Number,
            required: true
        },
        distination: {
            type: String,
            required: true
        },
        duration: {
            type: String,
            required: true
        },
        startToEndPolyline: {
            type: String,
            required: true
        },
        created_at: {
            type: Date,
            default: Date.now
        }
    },
    routeDetails: {
        type: Object,
    },
    Shipment_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Shipment",
        required: true
    },
    direction_uuid: {
        type: String,
        unique: true,
        default: () => uuidv4()
    },
});

const directionModel = mongoose.model("direction", directionsSchema);

module.exports = directionModel;
