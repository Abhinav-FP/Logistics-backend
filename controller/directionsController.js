const axios = require('axios');
const directionModel = require('../model/direction');
const catchAsync = require("../utils/catchAsync")


exports.AddDirection = catchAsync(async (req, res) => {
    let { pickup_location, drop_location, current_location, Shipment_id } = req.body;
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!pickup_location || !drop_location || !current_location) {
        return res.status(400).json({
            success: false,
            message: 'pickup_location, drop_location, and current_location are required',
        });
    }

    // Function to get latitude and longitude from address using Google Maps Geocoding API
    const getCoordinates = async (address) => {
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
        const response = await axios.get(geocodeUrl);
        if (response.data.status === 'OK') {
            const location = response.data.results[0].geometry.location;
            return { lat: location.lat, lng: location.lng };
        } else {
            throw new Error(`Failed to geocode address: ${address}`);
        }
    };

    try {
        // Fetch coordinates for all locations
        const [StartLocation, EndLocation, CurrentLocation] = await Promise.all([
            getCoordinates(pickup_location),
            getCoordinates(drop_location),
            getCoordinates(current_location)
        ]);

        const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${StartLocation.lat},${StartLocation.lng}&destination=${EndLocation.lat},${EndLocation.lng}&key=${apiKey}`;
        const startToCurrentUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${StartLocation.lat},${StartLocation.lng}&destination=${CurrentLocation.lat},${CurrentLocation.lng}&key=${apiKey}`;
        const currentToEndUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${CurrentLocation.lat},${CurrentLocation.lng}&destination=${EndLocation.lat},${EndLocation.lng}&key=${apiKey}`;

        // Fetch directions
        const [startToEndResponse, startToCurrentResponse, currentToEndResponse] = await Promise.all([
            axios.get(directionsUrl),
            axios.get(startToCurrentUrl),
            axios.get(currentToEndUrl),
        ]);

        if (startToEndResponse.data.status === 'OK' && startToCurrentResponse.data.status === 'OK' && currentToEndResponse.data.status === 'OK') {
            const startToEndLeg = startToEndResponse.data.routes[0].legs[0];
            const startToCurrentLeg = startToCurrentResponse.data.routes[0].legs[0];
            const currentToEndLeg = currentToEndResponse.data.routes[0].legs[0];

            const routeDetails = {
                StartToEndDistance: startToEndLeg.distance.text,
                StartToEndDuration: startToEndLeg.duration.text,
                StartToEndPolyline: startToEndResponse.data.routes[0].overview_polyline.points,
                StartToCurrentDistance: startToCurrentLeg.distance.text,
                StartToCurrentDuration: startToCurrentLeg.duration.text,
                StartToCurrentPolyline: startToCurrentResponse.data.routes[0].overview_polyline.points,
                CurrentToEndDistance: currentToEndLeg.distance.text,
                CurrentToEndDuration: currentToEndLeg.duration.text,
                CurrentToEndPolyline: currentToEndResponse.data.routes[0].overview_polyline.points,
            };

            const result = new directionModel({
                StartLocation: {
                    location:pickup_location ,
                    lat: StartLocation.lat,
                    lng: StartLocation.lng,
                    distination: startToEndLeg.distance.text,
                    duration: startToEndLeg.duration.text,
                    startToEndPolyline: startToEndResponse.data.routes[0].overview_polyline.points,
                },
                CurrentLocation: {
                    location:pickup_location ,
                    lat: CurrentLocation.lat,
                    lng: CurrentLocation.lng,
                    distination: startToCurrentLeg.distance.text,
                    duration: startToCurrentLeg.duration.text,
                    CurrentPolyline: startToCurrentResponse.data.routes[0].overview_polyline.points,
                },
                EndLocation: {
                    location: drop_location,
                    lat: EndLocation.lat,
                    lng: EndLocation.lng,
                    distination: currentToEndLeg.distance.text,
                    duration: currentToEndLeg.duration.text,
                    startToEndPolyline: currentToEndResponse.data.routes[0].overview_polyline.points,
                },
                routeDetails,
                Shipment_id
            });

            const data = await result.save();
          
        } 
    } catch (error) {
        console.error('Error:', error.message);
        console.log("error" , error)
    }
});



exports.getDirectionByUuid = catchAsync(async (req, res) => {
    try {
        const { uuid } = req.params;
        const result = await directionModel.findOne(
            {
                Shipment_id: uuid
            }
        ).lean();

        if (result) {
            res.json({
                result,
                success: true,
                message: "Data fetched successfully"
            });
        } else {
            res.status(404).json({
                success: false,
                message: "No data found"
            });
        }
    } catch (error) {
        console.log("error", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
});




