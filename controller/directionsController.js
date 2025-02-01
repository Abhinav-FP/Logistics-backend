const axios = require('axios');
const directionModel = require('../model/direction');
const catchAsync = require("../utils/catchAsync")

exports.AddDirection = catchAsync(
    async (req, res) => {
        let { StartLocation, EndLocation, CurrentLocation  ,Shipment_id } = req.body;


        const apiKey = process.env.GOOGLE_MAPS_API_KEY;

        if (!StartLocation || !EndLocation || !CurrentLocation) {
            return res.status(400).json({
                success: false,
                message: 'StartLocation, EndLocation, and CurrentLocation are required',
            });
        }
        const parseLocation = (location) => {
            const [lat, lng] = location.split(',').map(Number);
            return { lat, lng };
        };
        StartLocation = parseLocation(StartLocation);
        EndLocation = parseLocation(EndLocation);
        CurrentLocation = parseLocation(CurrentLocation);
        if (!StartLocation.lat || !StartLocation.lng || !EndLocation.lat || !EndLocation.lng || !CurrentLocation.lat || !CurrentLocation.lng) {
            return res.status(400).json({
                success: false,
                message: 'Invalid coordinates received',
            });
        }
        try {
            const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${StartLocation.lat},${StartLocation.lng}&destination=${EndLocation.lat},${EndLocation.lng}&key=${apiKey}`;
            const StartToCurrentUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${StartLocation.lat},${StartLocation.lng}&destination=${CurrentLocation.lat},${CurrentLocation.lng}&key=${apiKey}`;
            const currentToEndUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${CurrentLocation.lat},${CurrentLocation.lng}&destination=${EndLocation.lat},${EndLocation.lng}&key=${apiKey}`;

            const [startToEndResponse, StartToCurrentResponse, currentToEndResponse] = await Promise.all([
                axios.get(directionsUrl),
                axios.get(StartToCurrentUrl),
                axios.get(currentToEndUrl),
            ]);

            if (startToEndResponse.data.status === 'OK' && StartToCurrentResponse.data.status === 'OK' && currentToEndResponse.data.status === 'OK') {
                const startToEndLeg = startToEndResponse.data.routes[0].legs[0];
                const StartToCurrentLeg = StartToCurrentResponse.data.routes[0].legs[0];
                const currentToEndLeg = currentToEndResponse.data.routes[0].legs[0];
                const routeDetails = {
                    StartToEndDistance: startToEndLeg.distance.text,
                    StartToEndDuration: startToEndLeg.duration.text,
                    StartToEndPolyline: startToEndResponse.data.routes[0].overview_polyline.points,
                    StartToCurrentDistance: StartToCurrentLeg.distance.text,
                    StartToCurrentDuration: StartToCurrentLeg.duration.text,
                    StartToCurrentPolyline: StartToCurrentResponse.data.routes[0].overview_polyline.points,
                    currentToEndDistance: currentToEndLeg.distance.text,
                    currentToEndDuration: currentToEndLeg.duration.text,
                    currentToEndPolyline: currentToEndResponse.data.routes[0].overview_polyline.points,
                };

                const result = new directionModel({
                    StartLocation: {
                        lat: StartLocation.lat,
                        lng: StartLocation.lng,
                        distination: startToEndLeg.distance.text,
                        duration: startToEndLeg.duration.text,
                        startToEndPolyline: startToEndResponse.data.routes[0].overview_polyline.points,
                    },
                    CurrentLocation: {
                        lat: CurrentLocation.lat,
                        lng: CurrentLocation.lng,
                        distination: StartToCurrentLeg.distance.text,
                        duration: StartToCurrentLeg.duration.text,
                        CurrentPolyline: StartToCurrentResponse.data.routes[0].overview_polyline.points,
                    },
                    EndLocation: {
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
                console.log("Data saved successfully:", data);
                res.json({
                    success: true,
                    message: "Success",
                    data: data
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
    }
);

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

exports.updateDirections = catchAsync(async (req, res) => {
        let { Shipment_id, CurrentLocation } = req.body;
        try {
            const parseLocation = (location) => {
                const [lat, lng] = location.split(',').map(Number);
                return { lat, lng };
            };
            CurrentLocation = parseLocation(CurrentLocation);
    
            const doc = await directionModel.findOne({ Shipment_id });
            if (!doc) {
                console.error("No document found with Shipment_id:", Shipment_id);
                return res.status(404).json({
                    success: false,
                    message: "Shipment not found"
                });
            }
    
            if (!Array.isArray(doc.CurrentLocation)) {
                await directionModel.updateOne({ Shipment_id }, { $set: { CurrentLocation: [] } });
            }
    
            const { StartLocation, EndLocation } = doc;
    
            const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
            const StartToCurrentUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${StartLocation.lat},${StartLocation.lng}&destination=${CurrentLocation.lat},${CurrentLocation.lng}&key=${apiKey}`;
            const currentToEndUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${CurrentLocation.lat},${CurrentLocation.lng}&destination=${EndLocation.lat},${EndLocation.lng}&key=${apiKey}`;
    
            const [StartToCurrentResponse, currentToEndResponse] = await Promise.all([
                axios.get(StartToCurrentUrl),
                axios.get(currentToEndUrl),
            ]);
    
            if (StartToCurrentResponse.data.status === 'OK' && currentToEndResponse.data.status === 'OK') {
                const StartToCurrentLeg = StartToCurrentResponse.data.routes[0].legs[0];
                const currentToEndLeg = currentToEndResponse.data.routes[0].legs[0];
    
                const routeDetails = {
                    StartToEndDistance: doc.routeDetails.StartToEndDistance,
                    StartToEndDuration: doc.routeDetails.StartToEndDuration,
                    StartToEndPolyline: doc.routeDetails.StartToEndPolyline,
                    StartToCurrentDistance: StartToCurrentLeg.distance.text,
                    StartToCurrentDuration: StartToCurrentLeg.duration.text,
                    StartToCurrentPolyline: StartToCurrentResponse.data.routes[0].overview_polyline.points,
                    currentToEndDistance: currentToEndLeg.distance.text,
                    currentToEndDuration: currentToEndLeg.duration.text,
                    currentToEndPolyline: currentToEndResponse.data.routes[0].overview_polyline.points,
                };
    
                const result = await directionModel.findOneAndUpdate(
                    { Shipment_id },
                    {
                        $set: {
                            EndLocation: {
                                lat: EndLocation.lat,
                                lng: EndLocation.lng,
                                distination: currentToEndLeg.distance.text,
                                duration: currentToEndLeg.duration.text,
                                startToEndPolyline: currentToEndResponse.data.routes[0].overview_polyline.points,
                            },
                            routeDetails,
                        },
                        $push: {
                            CurrentLocation: {
                                lat: CurrentLocation.lat,
                                lng: CurrentLocation.lng,
                                distination: StartToCurrentLeg.distance.text,
                                duration: StartToCurrentLeg.duration.text,
                                CurrentPolyline: StartToCurrentResponse.data.routes[0].overview_polyline.points,
                                created_at: new Date(),
                            },
                        },
                    },
                    { new: true }
                );
    
                res.json({
                    success: true,
                    message: "Directions updated successfully",
                    data: result
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'Failed to fetch directions from Google Maps API',
                });
            }
        } catch (error) {
            console.error("Error updating directions:", error.message);
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }
);


