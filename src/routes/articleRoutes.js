import { Router } from 'express';
import { renderCreateForm, createArticle, showArticle } from '../controllers/articleController.js';
import { createComment } from '../controllers/commentController.js';
import { isAuthenticated } from '../middleware/authMiddleware.js';
import upload from '../middleware/multer.js'; 

const router = Router();

// Show form to create a new article (must be logged in)
router.get('/articles/new', isAuthenticated, renderCreateForm);

// Handle creation of a new article (must be logged in)
router.post('/articles', isAuthenticated, upload.single('headerImage'), createArticle);

// Route to handle comment submission
router.post('/articles/:slug/comments', isAuthenticated, createComment); // <-- ADD THIS

// Show a single article (publicly accessible)
// IMPORTANT: This route must be last, or it will catch things like /articles/new
router.get('/articles/:slug', showArticle);

export default router;
