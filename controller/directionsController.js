const axios = require('axios');
const directionmodels = require('../model/direction');


exports.getDirections = async (req, res) => {
    const { StartLocation, EndLocation, CurrentLocation } = req.body; // Expect data in request body
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    try {
        const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${StartLocation}&destination=${EndLocation}&key=${apiKey}`;
        const StartToCurrentUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${StartLocation}&destination=${CurrentLocation}&key=${apiKey}`;
        const currentToEndUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${CurrentLocation}&destination=${EndLocation}&key=${apiKey}`;



        // Fetch data from Google Maps API
        const [startToEndResponse, StartToCurrentResponse, currentToEndResponse] = await Promise.all([
            axios.get(directionsUrl),
            axios.get(StartToCurrentUrl),
            axios.get(currentToEndUrl),

        ]);

        if (startToEndResponse.data.status === 'OK' && StartToCurrentResponse.data.status === 'OK' && currentToEndResponse.data.status === 'OK') {
            const startToEndLeg = startToEndResponse.data.routes[0].legs[0];
            const StartToCurrentLeg = StartToCurrentResponse.data.routes[0].legs[0];
            const currentToEndLeg = currentToEndResponse.data.routes[0].legs[0];
            const combinedPolyline = `${StartToCurrentResponse.data.routes[0].overview_polyline.points}|${currentToEndResponse.data.routes[0].overview_polyline.points}|${startToEndResponse.data.routes[0].overview_polyline.points}`;
            const routeDetails = {
                startToEndDistance: startToEndLeg.distance.text,
                startToEndDuration: startToEndLeg.duration.text,
                startToEndPolyline: startToEndResponse.data.routes[0].overview_polyline.points,
                StartToCurrentDistance: StartToCurrentLeg.distance.text,
                StartToCurrentDuration: StartToCurrentLeg.duration.text,
                StartToCurrentPolyline: StartToCurrentResponse.data.routes[0].overview_polyline.points,
                currentToEndDistance: currentToEndLeg.distance.text,
                currentToEndDuration: currentToEndLeg.duration.text,
                currentToEndPolyline: currentToEndResponse.data.routes[0].overview_polyline.points,
                combinedPolyline: combinedPolyline,
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



