import request from 'supertest';
import app from '../../app.js';
import TrackingData from '../../models/TrackingData.js';

// test 1
describe('POST /info', () => {
  it('should save tracking data successfully', async () => {
    const trackingData = {
      totalVisitor: 'visitor-123',
      sessionId: 'session-456',
      userIp: '192.168.1.1',
      referrer: 'direct',
      currentPage: 'example.com',
      pathname: '/',
      websiteUrl: 'https://example.com',
    };

    const response = await request(app)
      .post('/info')
      .send(trackingData);

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('Tracking data saved successfully');

    const savedData = await TrackingData.findOne({ totalVisitor: 'visitor-123' });
    expect(savedData).toBeTruthy();
    expect(savedData.sessionId).toBe('session-456');
  });


//   test 2
  it('should return 500 for invalid data', async () => {
    const response = await request(app)
      .post('/info')
      .send({});

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('Internal server error');
  });
});