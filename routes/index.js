import { Router } from "express";
const router = Router();
import track from '../controllers/index.js';

router.get('/', (req, res) => {
    res.json({ message: 'Welcome to TrackrX API' });
});
router.post('/info', (req, res) => {
    console.log("server received tracking data:", req.body);
    track.track(req, res);
});
router.get('/get_metrics', (req, res) => { 
    track.getMetrics(req, res);
});

export default router;
    