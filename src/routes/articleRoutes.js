import { Router } from 'express';
import {
    renderCreateForm, createArticle, showArticle, listAllArticles,
    toggleFeaturedStatus, renderMyArticles, renderEditForm,
    updateArticle, toggleHiddenStatus, getLeaderboard
} from '../controllers/articleController.js';
import { createComment } from '../controllers/commentController.js';
import { isAuthenticated, hasRole, hasAnyRole } from '../middleware/authMiddleware.js';
import upload from '../middleware/multer.js';

const router = Router();

router.get('/articles', listAllArticles);
router.get('/articles/new', isAuthenticated, renderCreateForm);
router.get('/my-articles', isAuthenticated, renderMyArticles);
router.post('/articles', isAuthenticated, upload.single('headerImage'), createArticle);
router.get('/articles/:slug/edit', isAuthenticated, renderEditForm);
router.put('/articles/:slug', isAuthenticated, upload.single('headerImage'), updateArticle);
router.post('/articles/:slug/comments', isAuthenticated, createComment);
router.post('/articles/:slug/toggle-feature', hasRole('ADMIN'), toggleFeaturedStatus);
router.post('/articles/:slug/toggle-hidden', hasAnyRole(['ADMIN', 'MODERATOR']), toggleHiddenStatus);
router.get('/articles/:slug', showArticle);

// Add this route
router.get('/leaderboard', getLeaderboard);


export default router;
