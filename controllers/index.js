import TrackingData from '../models/TrackingData.js';
export async function track(req, res) {

    // extracting data from the request body
    const {
        sessionId,
        userIp,
        referrer,
        currentPage,
        utmParameters,
        deviceInfo,
        browserInfo,
        geolocation,
        scrollDepth,
        clickHeatmap,
        timeOnPage,
        bounceRate
    } = req.body;

    // save the tracking data to the database 
    // should be able to identify the data using base url to fetch the data later
    try {

        
        const trackingData = {
            sessionId,
            userIp,
            referrer,
            currentPage,
            utmParameters,
            deviceInfo,
            browserInfo,
            geolocation,
            scrollDepth,
            clickHeatmap,
            timeOnPage,
            bounceRate
        };
        const newTrackingData = new TrackingData(trackingData);
        await newTrackingData.save();        

        res.status(201).json({ message: 'Tracking data saved successfully' });
    } catch (error) {
        console.error('Error saving tracking data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
    // Respond to the client
    // res.status(200).json({ message: 'Tracking data received' });

    

}

export default { track };