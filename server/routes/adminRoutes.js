import express from 'express';
import {
    addAcademicStructure,
    getAcademicStructures,
    updateAcademicStructure,
    deleteAcademicStructure,
    getUsers,
    updateUser,
    deleteUser,
    addUser
} from '../controllers/adminController.js';
import { protect, roleGuard } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, roleGuard('ADMIN'));

// Academic Structures
router.route('/academic')
    .post(addAcademicStructure)
    .get(getAcademicStructures);

router.route('/academic/:id')
    .put(updateAcademicStructure)
    .delete(deleteAcademicStructure);

// Users (Students / Faculty)
router.route('/users')
    .post(addUser)
    .get(getUsers);

router.route('/users/:id')
    .put(updateUser)
    .delete(deleteUser);

export default router;
