import { Router } from 'express';
import { isAuthenticated, hasRole } from '../middleware/authMiddleware.js';
import { 
    renderProfile,
    deleteUploadedFile,
    renderUserManagement,
    toggleModerator
} from '../controllers/userController.js';

const router = Router();

// --- User Profile Routes ---
router.get('/profile', isAuthenticated, renderProfile);
router.delete('/profile/files/:fileId', isAuthenticated, deleteUploadedFile);

// --- Admin Routes ---
router.get('/admin/users', hasRole('ADMIN'), renderUserManagement);
router.post('/admin/users/:userId/toggle-moderator', hasRole('ADMIN'), toggleModerator);


export default router;
