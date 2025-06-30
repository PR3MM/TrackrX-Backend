import express from 'express';
import cors from 'cors';
import router from './routes/index.js';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
dotenv.config();


connectDB();

app.use('/', router);



app.listen(port, () => {
  console.log(`Server running on website at http://localhost:${port}`);
});