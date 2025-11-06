import request from 'supertest';
import app from '../../app.js';
import TrackingData from '../../models/TrackingData.js';


describe('GET /dashboard', () => {
  beforeEach(async () => {

    await TrackingData.create({
      totalVisitor: 'visitor-1',
      sessionId: 'session-1',
      userIp: '127.0.0.1',
      currentPage: 'test.com',
      pathname: '/',
      websiteUrl: 'https://test.com',
      timeOnPage: 60,
      bounceRate: 0,
      createdAt: new Date()
    });

    await TrackingData.create({
      totalVisitor: 'visitor-2',
      sessionId: 'session-2',
      userIp: '127.0.0.1',
      currentPage: 'test.com',
      pathname: '/',
      websiteUrl: 'https://test.com',
      timeOnPage: 120,
      bounceRate: 1,
      createdAt: new Date()
    });
  });

  it('should return unique website URLs', async () => {
    const response = await request(app).get('/dashboard');
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(['https://test.com']);
  });
});