// src/routes/fileRoutes.js
import { Router } from 'express';
import { serveFile } from '../controllers/fileController.js';

const router = Router();

// Route to serve files by filename
router.get('/:filename', serveFile);

export default router;
