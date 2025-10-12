import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri, { dbName: 'testdb' });

  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  console.log.mockRestore();
  console.error.mockRestore();
});

afterEach(async () => {
  await mongoose.connection.db.dropDatabase();
});