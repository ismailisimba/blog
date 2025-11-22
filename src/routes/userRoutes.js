import { Router } from 'express';
import { isAuthenticated, hasRole } from '../middleware/authMiddleware.js';
import {
    renderProfile,
    deleteUploadedFile,
    renderUserManagement,
    toggleModerator,
    toggleBan
} from '../controllers/userController.js';

const router = Router();

// --- User Profile Routes ---
router.get('/profile', isAuthenticated, renderProfile);
router.delete('/profile/files/:fileId', isAuthenticated, deleteUploadedFile);

// --- Admin Routes ---
router.get('/admin/users', hasRole('ADMIN'), renderUserManagement);
router.post('/admin/users/:userId/toggle-moderator', hasRole('ADMIN'), toggleModerator);
router.post('/admin/users/:userId/toggle-ban', hasRole('ADMIN'), toggleBan);


export default router;
