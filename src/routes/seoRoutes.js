import { Router } from 'express';
import { generateSitemap, generateRssFeed } from '../controllers/seoController.js';

const router = Router();

router.get('/sitemap.xml', generateSitemap);
router.get('/feed.xml', generateRssFeed);

export default router;
