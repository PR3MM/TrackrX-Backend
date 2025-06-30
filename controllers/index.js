import TrackingData from '../models/TrackingData.js';

export async function track(req, res) {
 
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
        // console.log("inside \"track\" function, trackingData:", trackingData);
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


export async function getMetrics(req, res) {

    try {
        let pathname = req.query.pathname || '';
        let timerange = req.query.timerange || '';
        let minTime = req.query.minTime || '';
        let maxTime = req.query.maxTime || '';

        // some optional parameters
        let country = req.query.country || '';
        let device = req.query.device || '';
        let browser = req.query.browser || '';

        // now we will fetch the tracking data from the database
        const query = {};
        if (pathname) {
            query.currentPage = { $regex: pathname, $options: 'i' };
        }
        if (timerange) {
            const now = new Date();
            const map = {
                '1h': 1, '6h': 6, '12h': 12,
                '1d': 24, '3d': 72,
                '24h': 24, '7d': 168, '30d': 720, '1y': 8760
            };
            const hours = map[timerange];
            if (hours) {
                query.createdAt = { $gte: new Date(now.getTime() - hours * 60 * 60 * 1000) };
            } else if (timerange !== 'all') {
                return res.status(400).json({ message: 'Invalid time range' });
            }
        }
        if (minTime) {
            query.timeOnPage = { $gte: parseInt(minTime) };
        }
        if (country) {
            query.geolocation = { $regex: country, $options: 'i' };
        }
        if (device) {
            query.deviceInfo = { $regex: device, $options: 'i' };
        }
        if (browser) {
            query.browserInfo = { $regex: browser, $options: 'i' };
        }
       
        const trackingData = await TrackingData.find(query).sort({ createdAt: -1 });

        const totalViews = trackingData.length;
        const avgTimeOnPage = trackingData.reduce((acc, data) => acc + (data.timeOnPage || 0), 0) / (totalViews || 1);
        const bounceCount = trackingData.filter(data => data.bounceRate === 1).length;
        const bounceRate = (bounceCount / (totalViews || 1)) * 100;

        const deviceStats = {};
        const countryStats = {};

        trackingData.forEach(data => {
            const devType = data.deviceInfo?.deviceType || 'Unknown';
            deviceStats[devType] = (deviceStats[devType] || 0) + 1;

            const country = data.geolocation?.country || 'Unknown';
            countryStats[country] = (countryStats[country] || 0) + 1;
        });

        const topCountries = Object.entries(countryStats)
            .map(([country, count]) => ({ country, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        res.status(200).json({
            totalViews,
            avgTimeOnPage: parseFloat(avgTimeOnPage.toFixed(2)),
            bounceRate: parseFloat(bounceRate.toFixed(2)),
            topCountries,
            deviceStats
        });
    } catch (error) {
        console.error('Error fetching tracking data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }


}

export default { track, getMetrics };