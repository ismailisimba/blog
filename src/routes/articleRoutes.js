import { Router } from 'express';
import { renderCreateForm, createArticle, showArticle, listAllArticles, toggleFeaturedStatus, renderMyArticles, renderEditForm, updateArticle } from '../controllers/articleController.js';
import { createComment } from '../controllers/commentController.js';
import { isAuthenticated, hasRole } from '../middleware/authMiddleware.js';
import upload from '../middleware/multer.js'; 

const router = Router();

router.get('/articles', listAllArticles);

// Show form to create a new article (must be logged in)
router.get('/articles/new', isAuthenticated, renderCreateForm);


router.get('/my-articles', isAuthenticated, renderMyArticles);

// Handle creation of a new article (must be logged in)
router.post('/articles', isAuthenticated, upload.single('headerImage'), createArticle);

// Show form to edit an article (must be logged in) <-- ADD THIS ROUTE
router.get('/articles/:slug/edit', isAuthenticated, renderEditForm);

// Handle update of an article (must be logged in) <-- ADD THIS ROUTE
router.put('/articles/:slug', isAuthenticated, updateArticle);

// Route to handle comment submission
router.post('/articles/:slug/comments', isAuthenticated, createComment); // <-- ADD THIS

router.post('/articles/:slug/toggle-feature', hasRole('ADMIN'), toggleFeaturedStatus);

// Show a single article (publicly accessible)
// IMPORTANT: This route must be last, or it will catch things like /articles/new
router.get('/articles/:slug', showArticle);

export default router;
