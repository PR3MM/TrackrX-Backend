import { Router } from "express";
const router = Router();
import track from '../controllers/index.js';

router.post('/track', (req, res) => {
    track.track(req, res);
});

export default router;
    