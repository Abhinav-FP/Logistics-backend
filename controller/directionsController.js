const axios = require('axios');
const directionmodels = require('../model/direction');


exports.getDirections = async (req, res) => {
    const { StartLocation, EndLocation, CurrentLocation } = req.body; // Expect data in request body
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    try {
        const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${StartLocation}&destination=${EndLocation}&key=${apiKey}`;
        const currentToStartUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${CurrentLocation}&destination=${EndLocation}&key=${apiKey}`;



        // Fetch data from Google Maps API
        const [startToEndResponse, currentToStartResponse] = await Promise.all([
            axios.get(directionsUrl),
            axios.get(currentToStartUrl),
        ]);

        if (startToEndResponse.data.status === 'OK' && currentToStartResponse.data.status === 'OK') {
            const startToEndLeg = startToEndResponse.data.routes[0].legs[0];
            const currentToStartLeg = currentToStartResponse.data.routes[0].legs[0];
            const combinedPolyline = `${currentToStartResponse.data.routes[0].overview_polyline.points}|${startToEndResponse.data.routes[0].overview_polyline.points}`;
            const routeDetails = {
                startToEndDistance: startToEndLeg.distance.text,
                endToCurrentDistance: currentToStartLeg.distance.text,
                startToEndDuration: startToEndLeg.duration.text,
                endToCurrentDuration: currentToStartLeg.duration.text,
                combinedPolyline: combinedPolyline,
                startToEndPolyline: startToEndResponse.data.routes[0].overview_polyline.points,
                currentToStartPolyline: currentToStartResponse.data.routes[0].overview_polyline.points,
            };


            // const result = new directionmodels({
            //     StartLocation: StartLocation,
            //     EndLocation: EndLocation,
            //     CurrentLocation: CurrentLocation,
            //     routeDetails: routeDetails,
            // });
            // const data = await result.save();
            // console.log("Data saved successfully:", data);
            // Send back directions and route details
            res.json({
                success: true,
                message: "Succees",
                data: routeDetails
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to fetch directions from Google Maps API',
            });
        }
    } catch (error) {
        console.error('Error fetching directions:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

