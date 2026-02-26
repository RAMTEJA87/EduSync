import express from 'express';
import { getStudentDashboardData } from '../controllers/studentController.js';
import { protect, roleGuard } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/dashboard', protect, roleGuard('STUDENT'), getStudentDashboardData);

export default router;
