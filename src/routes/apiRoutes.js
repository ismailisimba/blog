import { Router } from 'express';
import { handleFileUpload } from '../controllers/apiController.js';
import { isAuthenticated } from '../middleware/authMiddleware.js';
import upload from '../middleware/multer.js';

const router = Router();

// The single 'file' key is what the frontend will use in its FormData
router.post('/upload', isAuthenticated, upload.single('file'), handleFileUpload);

export default router;
