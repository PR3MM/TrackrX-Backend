//
import request from 'supertest';
import app from '../../app.js';
import TrackingData from '../../models/TrackingData.js';

describe('GET /get_metrics', () => {

    beforeEach(async () => {
        await TrackingData.create({
            totalVisitor: 'u1',
            sessionId: 's1',
            userIp: '1.2.3.4',
            currentPage: 'metrics.home',
            pathname: '/',
            websiteUrl: 'https://metrics.test',
            timeOnPage: 60,
            bounceRate: 0,
            createdAt: new Date()
        });
    });



    it('responds with metrics object for valid timerange', async () => {
        const res = await request(app).get('/get_metrics?pathname=metrics.home&timerange=24h');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('totalViews');
        expect(res.body).toHaveProperty('uniqueVisitors');
        expect(res.body).toHaveProperty('averageTimeonPage');

        expect(res.body.totalViews).toBe(1);
        expect(res.body.uniqueVisitors).toBe(1);
        expect(res.body.averageTimeonPage).toBe('1m');
        expect(res.body.bounceRate).toBe(0);
    });


    it('returns 400 for invalid timerange', async () => {
        const res = await request(app).get('/get_metrics?timerange=invalid');
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('message', 'Invalid time range');
    });


//    checking method behavior and computed values
    //   engagementBuckets is an object
    it('calculates engagement buckets correctly', async () => {
        const res = await request(app).get('/get_metrics?pathname=metrics.home&timerange=24h');
        expect(res.status).toBe(200);
        expect(res.body.engagementBuckets).toBeDefined();


        expect(res.body.engagementBuckets['1-3m']).toBe(1);
    });



    it('handles empty database gracefully', async () => {
        await TrackingData.deleteMany({});
        const res = await request(app).get('/get_metrics?pathname=metrics.home&timerange=24h');
        expect(res.status).toBe(200);


        expect(res.body.totalViews).toBe(0);
        expect(res.body.uniqueVisitors).toBe(0);
        expect(res.body.averageTimeonPage).toBe('0m');
    });
});
