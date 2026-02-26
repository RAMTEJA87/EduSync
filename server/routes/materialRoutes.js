import express from 'express';
import multer from 'multer';
import { protect, roleGuard } from '../middleware/authMiddleware.js';
import { uploadMaterial, getMaterialsByContext, deleteMaterial } from '../controllers/materialController.js';
import fs from 'fs';
import path from 'path';

const router = express.Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(process.cwd(), 'uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

router.post('/upload', protect, roleGuard('TEACHER', 'ADMIN'), upload.single('document'), uploadMaterial);
router.get('/context/:contextId', protect, getMaterialsByContext);
router.delete('/:id', protect, roleGuard('TEACHER', 'ADMIN'), deleteMaterial);

export default router;
