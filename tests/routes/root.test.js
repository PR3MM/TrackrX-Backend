import request from 'supertest';
import app from '../../app.js';

describe('GET /', () => {
  it('returns welcome message', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Welcome to TrackrX API');
  });
});
  