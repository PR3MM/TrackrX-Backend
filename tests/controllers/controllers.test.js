import request from 'supertest';
import app from '../../app.js';
import TrackingData from '../../models/TrackingData.js';

jest.mock('../../models/TrackingData.js');

describe('controllers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  
  //unit testing to test successfull data saving and error handling
  describe('track', () => {
    it('saves tracking data and returns 201', async () => {
      TrackingData.mockImplementation(function (data) {
        return { save: jest.fn().mockResolvedValueOnce({ ...data, _id: '1' }) };
      });

      const res = await request(app).post('/info').send({
        totalVisitor: 'visitor1',
        sessionId: 's1',
        userIp: '1.2.3.4',
        currentPage: 'home',
        pathname: 'metrics.home',
        websiteUrl: 'https://example.com'
      });

      expect(res.status).toBe(201);
      expect(res.body.message).toMatch(/Tracking data saved/);
    });


    it('handles save errors and returns 500', async () => {
      TrackingData.mockImplementation(function () {
        // simulate save error
        return { save: jest.fn().mockRejectedValueOnce(new Error('db error')) };
      });

      const res = await request(app).post('/info').send({
        totalVisitor: 'visitor1',
        sessionId: 's1',
        userIp: '1.2.3.4',
        currentPage: 'home',
        pathname: 'metrics.home',
        websiteUrl: 'https://example.com'
      });

      expect(res.status).toBe(500);
      expect(res.body.message).toMatch(/Internal server error/);
    });
  });



  describe('getMetrics', () => {
    it('returns 400 for invalid timerange', async () => {

      TrackingData.find = jest.fn();

      const res = await request(app).get('/get_metrics').query({ timerange: 'bad' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Invalid time range/);
      expect(TrackingData.find).not.toHaveBeenCalled();
    });

    it('returns metrics and computed fields', async () => {
      const now = new Date();
      const doc = {
        totalVisitor: 'v1',
        timeOnPage: 120,
        bounceRate: 0,
        deviceInfo: { deviceType: 'mobile', os: 'iOS' },
        geolocation: { country: 'Wonderland' },
        referrer: 'Direct',
        pathname: 'metrics.home',
        websiteUrl: 'https://example.com',
        createdAt: now
      };

  // Mock find to return an object with sort() that returns the array
  TrackingData.find = jest.fn().mockImplementation(() => ({ sort: () => Promise.resolve([doc]) }));

      const res = await request(app).get('/get_metrics').query({ pathname: 'metrics.home' });

      expect(res.status).toBe(200);
      expect(res.body.totalViews).toBe(1);
      expect(res.body.uniqueVisitors).toBe(1);
      expect(res.body.averageTimeonPage).toBe('2m');
      expect(res.body.engagementBuckets['1-3m']).toBe(1);
    });

    it('builds chartData for 1h timerange and counts intervals', async () => {
      const now = new Date();

      const docs = [];
      for (let i = 0; i < 6; i++) {
        docs.push({
          totalVisitor: `v${i}`,
          timeOnPage: i === 2 ? 5 : 120,  
          bounceRate: 0,
          deviceInfo: { deviceType: 'mobile', os: 'iOS' },
          geolocation: { country: 'Wonderland' },
          referrer: 'Direct',
          pathname: 'metrics.home',
          websiteUrl: 'https://example.com',
          createdAt: new Date(now.getTime() - (50 - i * 10) * 60 * 1000)
        });
      }

      let receivedQuery;
      TrackingData.find = jest.fn().mockImplementation((q) => {
        receivedQuery = q;
        return { sort: () => Promise.resolve(docs) };
      });

      const res = await request(app).get('/get_metrics').query({ timerange: '1h' });

      expect(res.status).toBe(200);

      expect(res.body.chartData.labels.length).toBe(6);
      expect(res.body.totalViews).toBe(6);

      expect(receivedQuery.createdAt).toBeDefined();
    });

    //  test query params filtering
    it('supports minTime, device and browser query params', async () => {
      const doc = { totalVisitor: 'x', timeOnPage: 200, bounceRate: 0, deviceInfo: { deviceType: 'desktop' }, geolocation: { country: 'A' }, referrer: 'R', pathname: 'p', websiteUrl: 'u', createdAt: new Date() };
      let receivedQuery;
      TrackingData.find = jest.fn().mockImplementation((q) => { receivedQuery = q; return { sort: () => Promise.resolve([doc]) }; });

      const res = await request(app).get('/get_metrics').query({ minTime: '100', device: 'desktop', browser: 'Chrome', country: 'A' });

      expect(res.status).toBe(200);
      expect(receivedQuery.timeOnPage).toBeDefined();
      expect(receivedQuery.deviceInfo).toBeDefined();
      expect(receivedQuery.browserInfo).toBeDefined();
      expect(receivedQuery.geolocation).toBeDefined();
    });

    it('handles large timerange types: 6h, 7d, 6m, 1y', async () => {
      const now = new Date();
      const docs = [
        { totalVisitor: 'a', timeOnPage: 10, bounceRate: 0, deviceInfo: {}, geolocation: {}, referrer: '', pathname: 'p', websiteUrl: 'u', createdAt: now }
      ];

      TrackingData.find = jest.fn().mockImplementation(() => ({ sort: () => Promise.resolve(docs) }));

      const ranges = ['6h', '7d', '6m', '1y', 'all'];
      for (const r of ranges) {
        const res = await request(app).get('/get_metrics').query({ timerange: r });
        expect(res.status).toBe(200);
        expect(res.body.totalViews).toBe(1);
      }
    });

    //  test intervalSize logic for various timeranges
    it('builds hours-interval chartData for 12h (intervalSize 2)', async () => {
      const now = new Date();
      const doc = { totalVisitor: 'a', timeOnPage: 10, bounceRate: 0, deviceInfo: {}, geolocation: {}, referrer: '', pathname: 'p', websiteUrl: 'u', createdAt: now };
      TrackingData.find = jest.fn().mockImplementation(() => ({ sort: () => Promise.resolve([doc]) }));

      const res = await request(app).get('/get_metrics').query({ timerange: '12h' });
      expect(res.status).toBe(200);
      // 12 hours with intervalSize 2 -> 6 intervals
      expect(res.body.chartData.labels.length).toBe(6);
    });

    it('builds hours-interval chartData for 3d (intervalSize 12)', async () => {
      const now = new Date();
      const doc = { totalVisitor: 'b', timeOnPage: 5, bounceRate: 0, deviceInfo: {}, geolocation: {}, referrer: '', pathname: 'p', websiteUrl: 'u', createdAt: now };
      TrackingData.find = jest.fn().mockImplementation(() => ({ sort: () => Promise.resolve([doc]) }));

      const res = await request(app).get('/get_metrics').query({ timerange: '3d' });
      expect(res.status).toBe(200);
      // 3 days -> 72 hours with intervalSize 12 -> 6 intervals
      expect(res.body.chartData.labels.length).toBe(6);
    });

    it('returns 500 when find throws', async () => {
      TrackingData.find = jest.fn().mockImplementation(() => { throw new Error('boom'); });
      const res = await request(app).get('/get_metrics');
      expect(res.status).toBe(500);
    });

    // test default 30-day chartData and engagement buckets logic
    it('uses default 30-day chartData when no timerange provided', async () => {
      const now = new Date();
      // two docs on different days within last 30 days
      const docs = [
        { totalVisitor: 'd1', timeOnPage: 10, bounceRate: 0, deviceInfo: {}, geolocation: {}, referrer: '', pathname: 'p', websiteUrl: 'u', createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) },
        { totalVisitor: 'd2', timeOnPage: 20, bounceRate: 1, deviceInfo: {}, geolocation: {}, referrer: '', pathname: 'p', websiteUrl: 'u', createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) }
      ];
      TrackingData.find = jest.fn().mockImplementation(() => ({ sort: () => Promise.resolve(docs) }));

      const res = await request(app).get('/get_metrics');
      expect(res.status).toBe(200);

      expect(res.body.chartData.labels.length).toBe(30);
      expect(res.body.totalViews).toBe(2);

      expect(typeof res.body.bounceRate).toBe('number');
    });

    it('computes all engagement buckets correctly', async () => {
      const now = new Date();
      const docs = [
        { totalVisitor: 'b0', timeOnPage: 5, bounceRate: 0, deviceInfo: {}, geolocation: {}, referrer: '', pathname: 'p', websiteUrl: 'u', createdAt: now }, // 0-10s
        { totalVisitor: 'b1', timeOnPage: 15, bounceRate: 0, deviceInfo: {}, geolocation: {}, referrer: '', pathname: 'p', websiteUrl: 'u', createdAt: now }, // 10-30s
        { totalVisitor: 'b2', timeOnPage: 45, bounceRate: 0, deviceInfo: {}, geolocation: {}, referrer: '', pathname: 'p', websiteUrl: 'u', createdAt: now }, // 30-60s
        { totalVisitor: 'b3', timeOnPage: 120, bounceRate: 0, deviceInfo: {}, geolocation: {}, referrer: '', pathname: 'p', websiteUrl: 'u', createdAt: now }, // 1-3m
        { totalVisitor: 'b4', timeOnPage: 240, bounceRate: 0, deviceInfo: {}, geolocation: {}, referrer: '', pathname: 'p', websiteUrl: 'u', createdAt: now }, // 3-5m
        { totalVisitor: 'b5', timeOnPage: 400, bounceRate: 0, deviceInfo: {}, geolocation: {}, referrer: '', pathname: 'p', websiteUrl: 'u', createdAt: now }, // 5-10m
        { totalVisitor: 'b6', timeOnPage: 700, bounceRate: 0, deviceInfo: {}, geolocation: {}, referrer: '', pathname: 'p', websiteUrl: 'u', createdAt: now } // 10m+
      ];

      TrackingData.find = jest.fn().mockImplementation(() => ({ sort: () => Promise.resolve(docs) }));

      const res = await request(app).get('/get_metrics');
      expect(res.status).toBe(200);
      const buckets = res.body.engagementBuckets;
      expect(buckets['0-10s']).toBe(1);
      expect(buckets['10-30s']).toBe(1);
      expect(buckets['30-60s']).toBe(1);
      expect(buckets['1-3m']).toBe(1);
      expect(buckets['3-5m']).toBe(1);
      expect(buckets['5-10m']).toBe(1);
      expect(buckets['10m+']).toBe(1);
    });
  });

  describe('dashboard.getDashboard', () => {
    it('returns unique website urls', async () => {
      const docs = [
        { websiteUrl: 'https://a.com' },
        { websiteUrl: 'https://b.com' },
        { websiteUrl: 'https://a.com' },
        { websiteUrl: null }
      ];
      TrackingData.find = jest.fn().mockResolvedValue(docs);

      const res = await request(app).get('/dashboard');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(expect.arrayContaining(['https://a.com', 'https://b.com']));
    });

    it('returns 500 when find throws', async () => {
      TrackingData.find = jest.fn().mockRejectedValue(new Error('fail'));
      const res = await request(app).get('/dashboard');
      expect(res.status).toBe(500);
    });
  });
});
