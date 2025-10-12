import express from 'express';
import cors from 'cors';
import router from './routes/index.js';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
dotenv.config();
const app = express();
const port = process.env.PORT || 3001;

app.use(cors("*"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));


connectDB();

app.use('/', router);


function initializeSelfPing() {
  // Only run in production (Render environment)
  if (process.env.NODE_ENV !== 'production') {
    console.log('🔧 Self-ping disabled in development mode');
    return;
  }

  const PING_INTERVAL = 13 * 60 * 1000; // 13 minutes
  const SERVICE_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
  
  function selfPing() {
    fetch(`${SERVICE_URL}/api/health`)
      .then(response => {
        if (response.ok) {
          console.log(`✅ Self-ping successful at ${new Date().toISOString()}`);
        } else {
          console.log(`⚠️ Self-ping returned ${response.status} at ${new Date().toISOString()}`);
        }
      })
      .catch(error => {
        console.error(`❌ Self-ping failed at ${new Date().toISOString()}:`, error.message);
      });
  }
app.listen(port, () => {
  console.log(`Server running on website at http://localhost:${port}`);
  initializeSelfPing();
});