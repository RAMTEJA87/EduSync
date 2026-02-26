import express from 'express';
import { summarizeYoutube, doubtSolverChat, generateSmartRevision } from '../controllers/aiController.js';
import { protect, roleGuard } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/youtube', protect, roleGuard('STUDENT', 'TEACHER', 'ADMIN'), summarizeYoutube);
router.post('/chat', protect, roleGuard('STUDENT', 'TEACHER', 'ADMIN'), doubtSolverChat);
router.get('/revision', protect, roleGuard('STUDENT'), generateSmartRevision);

export default router;
