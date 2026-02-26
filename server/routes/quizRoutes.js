import express from 'express';
import multer from 'multer';
import { generateQuiz, getQuizForStudent, submitQuiz, deleteQuiz } from '../controllers/quizController.js';
import { protect, roleGuard } from '../middleware/authMiddleware.js';

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 16 * 1024 * 1024 },
});

// Teacher only
router.post('/generate', protect, roleGuard('TEACHER', 'ADMIN'), upload.single('document'), generateQuiz);
router.delete('/:id', protect, roleGuard('TEACHER', 'ADMIN'), deleteQuiz);

// Student only
router.get('/:id/attempt', protect, roleGuard('STUDENT'), getQuizForStudent);
router.post('/:id/submit', protect, roleGuard('STUDENT'), submitQuiz);

export default router;
