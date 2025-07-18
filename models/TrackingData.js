import { Schema, model } from 'mongoose';

const trackingDataSchema = new Schema({
    totalVisitor: { type: String, required: true },  
    sessionId: { type: String, required: true },
    userIp: { type: String, required: true },
    referrer: { type: String  },
    currentPage: { type: String, required: true },
    pathname: { type: String, required: true },
    websiteUrl: { type: String, required: true },
    utmParameters: { type: Object, default: {} },
    deviceInfo: { type: Object, default: {} },
    browserInfo: { type: Object, default: {} },
    geolocation: { type: Object, default: {} },
    scrollDepth: { type: Number, default: 0 },
    clickHeatmap: { type: Object, default: {} },
    timeOnPage: { type: Number, default: 0 },
    bounceRate: { type: Number, default: 0 }
}, {
    timestamps: true,
    collection: 'tracking_data'
});

// Create index on totalVisitor for better performance when counting unique visitors
trackingDataSchema.index({ totalVisitor: 1 });

const TrackingData = model('TrackingData', trackingDataSchema);

export default TrackingData;

