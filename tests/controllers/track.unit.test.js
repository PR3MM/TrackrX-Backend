import { track } from '../../controllers/index.js';
import TrackingData from '../../models/TrackingData.js';

//test 1
describe('controllers.track (unit)', () => {
  it('saves tracking data and responds 201', async () => {
    const req = {
      body: {
        totalVisitor: 'tu1',
        sessionId: 'sess-1',
        userIp: '127.0.0.1',
        currentPage: 'example',
        pathname: '/',
        websiteUrl: 'https://example.com'
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await track(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ message: 'Tracking data saved successfully' });

    const doc = await TrackingData.findOne({ totalVisitor: 'tu1' });
    expect(doc).toBeTruthy();
  });


  //test 2
  it('responds 500 when body missing required fields', async () => {
    const req = { body: {} };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await track(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
  });
});
