import connectDB from '../../config/db.js';

jest.mock('mongoose', () => ({ connect: jest.fn() }));
import { connect } from 'mongoose';

describe('config/db', () => {
  beforeEach(() => {
    process.env.MONGO_URI = 'mongodb://localhost/test';
    process.env.DB_NAME = 'testdb';
    connect.mockReset();
  });

  it('calls mongoose.connect with environment values', async () => {
    connect.mockResolvedValueOnce();
    await connectDB();
    expect(connect).toHaveBeenCalledWith('mongodb://localhost/test', expect.objectContaining({
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: 'testdb'
    }));
  });

  it('exits process on connection error', async () => {
    const spyExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('process.exit called'); });
    connect.mockRejectedValueOnce(new Error('failed'));

    await expect(connectDB()).rejects.toThrow('process.exit called');

    spyExit.mockRestore();
  });
});
