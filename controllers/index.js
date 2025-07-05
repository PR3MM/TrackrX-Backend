import { mongo } from 'mongoose';
import TrackingData from '../models/TrackingData.js';

export async function track(req, res) {

    const {
        totalVisitor,
        sessionId,
        userIp,
        referrer,
        currentPage,
        pathname,
        websiteUrl,
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
            totalVisitor,
            sessionId,
            userIp,
            referrer,
            currentPage,
            pathname,
            websiteUrl,
            utmParameters,
            deviceInfo,
            browserInfo,
            geolocation,
            scrollDepth,
            clickHeatmap,
            timeOnPage,
            bounceRate
        };
        console.log("222xsinside \"track\" function, trackingData:", trackingData);
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
                '24h': 24, '7d': 168, '30d': 720,'6m':4382 ,'1y': 8760
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
        console.log(trackingData.length, "trackingData:", trackingData);
        const totalViews = trackingData.length;
        
        // Calculate unique visitors using totalVisitor field
        const uniqueVisitors = new Set(trackingData.map(data => data.totalVisitor)).size;
        
        const avgTimeOnPage = trackingData.reduce((acc, data) => acc + (data.timeOnPage || 0), 0) / (totalViews || 1);
        const bounceCount = trackingData.filter(data => data.bounceRate === 1).length;
        const bounceRate = (bounceCount / (totalViews || 1)) * 100;

        //convert avgTimeOnPage to readable format like 10m
        const averageTimeonPage = `${Math.floor(avgTimeOnPage / 60)}m`;

        // engagement buckets
        const engagementBuckets = {
            '0-10s': 0,
            '10-30s': 0,
            '30-60s': 0,
            '1-3m': 0,
            '3-5m': 0,
            '5-10m': 0,
            '10m+': 0
        };
        trackingData.forEach(data => {
            const time = data.timeOnPage || 0;
            if (time < 10) {
                engagementBuckets['0-10s']++;
            } else if (time < 30) {
                engagementBuckets['10-30s']++;
            } else if (time < 60) {
                engagementBuckets['30-60s']++;
            } else if (time < 180) {
                engagementBuckets['1-3m']++;
            } else if (time < 300) {
                engagementBuckets['3-5m']++;
            } else if (time < 600) {
                engagementBuckets['5-10m']++;
            } else {
                engagementBuckets['10m+']++;
            }
        });


        const deviceStats = {};
        const countryStats = {};
        const osStats = {};
        const topreferrers = {};
        const topPages = {};

        trackingData.forEach(data => {
            const devType = data.deviceInfo?.deviceType || 'Unknown';
            deviceStats[devType] = (deviceStats[devType] || 0) + 1;

            const country = data.geolocation?.country || 'Unknown';
            countryStats[country] = (countryStats[country] || 0) + 1;

            const os = data.deviceInfo?.os || 'Unknown';
            osStats[os] = (osStats[os] || 0) + 1;

            const referrer = data.referrer || 'Direct';
            topreferrers[referrer] = (topreferrers[referrer] || 0) + 1;

            const page = data.pathname || 'Unknown';
            topPages[page] = (topPages[page] || 0) + 1;

        });

        // const topCountries = Object.entries(countryStats)
        //     .map(([country, count]) => ({ country, count }))
        //     .sort((a, b) => b.count - a.count)
        //     .slice(0, 5);
        const topCountries = countryStats;

        // Generate time series data based on selected timerange
        let chartData = { labels: [], data: [] };
        
        if (timerange && timerange !== 'all') {
            const now = new Date();
            const timeRangeMap = {
                '1h': { hours: 1, interval: 'minutes', intervalSize: 10 },
                '6h': { hours: 6, interval: 'hours', intervalSize: 1 },
                '12h': { hours: 12, interval: 'hours', intervalSize: 2 },
                '1d': { hours: 24, interval: 'hours', intervalSize: 4 },
                '24h': { hours: 24, interval: 'hours', intervalSize: 4 },
                '3d': { hours: 72, interval: 'hours', intervalSize: 12 },
                '7d': { hours: 168, interval: 'days', intervalSize: 1 },
                '30d': { hours: 720, interval: 'days', intervalSize: 1 },
                '6m': { hours: 4382, interval: 'weeks', intervalSize: 1 },
                '1y': { hours: 8760, interval: 'months', intervalSize: 1 }
            };

            const config = timeRangeMap[timerange];
            if (config) {
                const startTime = new Date(now.getTime() - config.hours * 60 * 60 * 1000);
                
                if (config.interval === 'minutes') {
                    // For 1 hour - 10 minute intervals
                    for (let i = 0; i < 6; i++) {
                        const intervalStart = new Date(startTime.getTime() + i * 10 * 60 * 1000);
                        const intervalEnd = new Date(startTime.getTime() + (i + 1) * 10 * 60 * 1000);
                        const label = `${intervalStart.getHours()}:${intervalStart.getMinutes().toString().padStart(2, '0')}`;
                        
                        const count = trackingData.filter(data => {
                            const dataTime = new Date(data.createdAt);
                            return dataTime >= intervalStart && dataTime < intervalEnd;
                        }).length;
                        
                        chartData.labels.push(label);
                        chartData.data.push(count);
                    }
                } else if (config.interval === 'hours') {
                    // For 6h, 12h, 1d, 3d
                    const intervals = Math.ceil(config.hours / config.intervalSize);
                    for (let i = 0; i < intervals; i++) {
                        const intervalStart = new Date(startTime.getTime() + i * config.intervalSize * 60 * 60 * 1000);
                        const intervalEnd = new Date(startTime.getTime() + (i + 1) * config.intervalSize * 60 * 60 * 1000);
                        
                        let label;
                        if (config.intervalSize === 1) {
                            label = `${intervalStart.getHours()}:00`;
                        } else {
                            label = `${intervalStart.getHours()}:00-${intervalEnd.getHours()}:00`;
                        }
                        
                        const count = trackingData.filter(data => {
                            const dataTime = new Date(data.createdAt);
                            return dataTime >= intervalStart && dataTime < intervalEnd;
                        }).length;
                        
                        chartData.labels.push(label);
                        chartData.data.push(count);
                    }
                } else if (config.interval === 'days') {
                    // For 7d, 30d
                    const days = Math.ceil(config.hours / 24);
                    for (let i = 0; i < days; i++) {
                        const dayStart = new Date(startTime);
                        dayStart.setDate(dayStart.getDate() + i);
                        dayStart.setHours(0, 0, 0, 0);
                        
                        const dayEnd = new Date(dayStart);
                        dayEnd.setDate(dayEnd.getDate() + 1);
                        
                        const label = dayStart.toISOString().split('T')[0];
                        
                        const count = trackingData.filter(data => {
                            const dataTime = new Date(data.createdAt);
                            return dataTime >= dayStart && dataTime < dayEnd;
                        }).length;
                        
                        chartData.labels.push(label);
                        chartData.data.push(count);
                    }
                } else if (config.interval === 'weeks') {
                    // For 6m
                    const weeks = Math.ceil(config.hours / (24 * 7));
                    for (let i = 0; i < weeks; i++) {
                        const weekStart = new Date(startTime);
                        weekStart.setDate(weekStart.getDate() + i * 7);
                        weekStart.setHours(0, 0, 0, 0);
                        
                        const weekEnd = new Date(weekStart);
                        weekEnd.setDate(weekEnd.getDate() + 7);
                        
                        const label = `Week ${weekStart.toISOString().split('T')[0]}`;
                        
                        const count = trackingData.filter(data => {
                            const dataTime = new Date(data.createdAt);
                            return dataTime >= weekStart && dataTime < weekEnd;
                        }).length;
                        
                        chartData.labels.push(label);
                        chartData.data.push(count);
                    }
                } else if (config.interval === 'months') {
                    // For 1y
                    for (let i = 0; i < 12; i++) {
                        const monthStart = new Date(startTime);
                        monthStart.setMonth(monthStart.getMonth() + i);
                        monthStart.setDate(1);
                        monthStart.setHours(0, 0, 0, 0);
                        
                        const monthEnd = new Date(monthStart);
                        monthEnd.setMonth(monthEnd.getMonth() + 1);
                        
                        const label = `${monthStart.getFullYear()}-${(monthStart.getMonth() + 1).toString().padStart(2, '0')}`;
                        
                        const count = trackingData.filter(data => {
                            const dataTime = new Date(data.createdAt);
                            return dataTime >= monthStart && dataTime < monthEnd;
                        }).length;
                        
                        chartData.labels.push(label);
                        chartData.data.push(count);
                    }
                }
            }
        } else {
            // Default: show last 30 days when no timerange specified
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 30);
            
            for (let i = 0; i < 30; i++) {
                const d = new Date(startDate);
                d.setDate(d.getDate() + i);
                const dayStart = new Date(d);
                dayStart.setHours(0, 0, 0, 0);
                const dayEnd = new Date(d);
                dayEnd.setHours(23, 59, 59, 999);
                
                const label = d.toISOString().split('T')[0];
                
                const count = trackingData.filter(data => {
                    const dataTime = new Date(data.createdAt);
                    return dataTime >= dayStart && dataTime <= dayEnd;
                }).length;
                
                chartData.labels.push(label);
                chartData.data.push(count);
            }
        }

        // Legacy stats for backward compatibility
        const dailyStats = {};
        const weeklyStats = {};
        const monthlyStats = {};
        trackingData.forEach(data => {
            const date = new Date(data.createdAt);
            const day = date.toISOString().split('T')[0];
            const week = new Date(date.setDate(date.getDate() - date.getDay())).toISOString().split('T')[0];
            const month = date.toISOString().split('T')[0].slice(0, 7);  
            dailyStats[day] = (dailyStats[day] || 0) + 1;
            weeklyStats[week] = (weeklyStats[week] || 0) + 1;
            monthlyStats[month] = (monthlyStats[month] || 0) + 1;
        });

        // peaktraffic time
        const peakTrafficTime = {};
        trackingData.forEach(data => {
            const hour = new Date(data.createdAt).getHours();
            peakTrafficTime[hour] = (peakTrafficTime[hour] || 0) + 1;
        });



        res.status(200).json({
            totalViews,
            uniqueVisitors,
            averageTimeonPage,
            bounceRate: parseFloat(bounceRate.toFixed(2)),
            topCountries,
            deviceStats,
            osStats,
            topreferrers,
            topPages,
            engagementBuckets,
            chartData, 
            dailyStats,
            weeklyStats,
            monthlyStats,
            peakTrafficTime
        });
    } catch (error) {
        console.error('Error fetching tracking data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }


}

export default { track, getMetrics };