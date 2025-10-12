import TrackingData from '../../models/TrackingData.js';
import mongoose from 'mongoose';

// test 1
describe('TrackingData Model', () => {
  it('should save tracking data document', async () => {
    const trackingData = new TrackingData({
      totalVisitor: 'visitor-123',
      sessionId: 'session-456',
      userIp: '192.168.1.1',
      referrer: 'direct',
      currentPage: 'example.com',
      pathname: '/',
      websiteUrl: 'https://example.com',
    });

    const savedData = await trackingData.save();
    expect(savedData).toBeDefined();
    expect(savedData.totalVisitor).toBe('visitor-123');
  });

  // test 2
  it('should require totalVisitor, sessionId, userIp, currentPage, pathname, and websiteUrl', async () => {
    const trackingData = new TrackingData({});

    let error;
    try {
      await trackingData.save();
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(error.errors.totalVisitor).toBeDefined();
    expect(error.errors.sessionId).toBeDefined();
    expect(error.errors.userIp).toBeDefined();
    expect(error.errors.currentPage).toBeDefined();
    expect(error.errors.pathname).toBeDefined();
    expect(error.errors.websiteUrl).toBeDefined();
  });
});