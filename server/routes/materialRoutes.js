import express from 'express';
import multer from 'multer';
import { protect, roleGuard } from '../middleware/authMiddleware.js';
import { uploadMaterial, getMaterialsByContext, deleteMaterial, downloadMaterial } from '../controllers/materialController.js';

const router = express.Router();

const ALLOWED_MIMETYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 16 * 1024 * 1024 }, // 16 MB max (MongoDB doc limit is 16MB)
    fileFilter: (req, file, cb) => {
        if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`File type not allowed: ${file.mimetype}`));
        }
    }
});

router.post('/upload', protect, roleGuard('TEACHER'), upload.single('document'), uploadMaterial);
router.get('/download/:id', protect, downloadMaterial);
router.get('/context/:contextId', protect, getMaterialsByContext);
router.delete('/:id', protect, roleGuard('TEACHER'), deleteMaterial);

export default router;
