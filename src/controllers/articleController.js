//Start of articleController.js

import { prisma } from '../services/prisma.js';
import slugify from 'slugify';
import { nanoid } from 'nanoid';
import { marked } from 'marked';
import { processAndUploadImage, deleteFile } from '../services/storage.js';
import { truncateText } from '../utils/helpers.js';

// --- SECURITY IMPORTS ---
import { JSDOM } from 'jsdom';
import createDOMPurify from 'dompurify';

// Setup DOMPurify for server-side sanitization
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

const generateUniqueSlug = async (title) => {
  let slug = slugify(title, { lower: true, strict: true });
  
  // Check if this slug exists
  const existing = await prisma.article.findUnique({ 
    where: { slug: slug } 
  });

  // If it exists, append a random short ID (e.g., "my-title-xc92")
  if (existing) {
    slug = `${slug}-${nanoid(5)}`;
  }

  return slug;
};

// Renders the form to create a new article
export const renderCreateForm = (req, res) => {
  res.render('pages/articles/create', { user: req.user });
};

// Handles the submission of the new article form
export const createArticle = async (req, res) => {
  try {
    const { title, content, excerpt, action, headerImage } = req.body;
    let imageUrl = null;

    if (req.file) {
    
      const { publicUrl, fileName } = await processAndUploadImage(
        req.file.buffer,
        req.file.originalname,
        { resize: { width: 960, height: 540 } } // <-- Enforce dimensions
      );
      imageUrl = publicUrl;
      await prisma.uploadedFile.create({
        data: { url: publicUrl, fileName: fileName, userId: req.user.id },
      });
    }


    const finalSlug = await generateUniqueSlug(title);

    const newArticle = await prisma.article.create({
      data: {
        title,
        content,
        excerpt,
        headerImageUrl: imageUrl,
        slug: finalSlug,
        authorId: req.user.id,
        published: action === 'publish',
      },
    });
    res.redirect(`/articles/${newArticle.slug}`);
  } catch (error) {
    console.error('Error creating article:', error);
    res.redirect('/articles/new');
  }
};

// Displays a single article
export const showArticle = async (req, res) => {
  try {
    const { slug } = req.params;
    const article = await prisma.$transaction(async (tx) => {
      const articleData = await tx.article.findUnique({
        where: { slug },
        include: {
          author: true,
          comments: {
            include: { author: true },
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!articleData) return null;

      // Authorization check: Only Admins/Mods can see hidden articles
      const canViewHidden = req.user && (req.user.role === 'ADMIN' || req.user.role === 'MODERATOR');
      if (articleData.hidden && !canViewHidden) {
        return null; // Pretend it doesn't exist for normal users
      }

      await tx.article.update({
        where: { slug },
        data: { viewCount: { increment: 1 } },
      });

      return articleData;
    });

    if (!article) {
      return res.status(404).send('Article not found');
    }

    // --- START OF NEW CODE ---
    // Custom renderer for marked
    const renderer = new marked.Renderer();

    // Override how links are rendered
    renderer.link = ({ href, title, text }) => {
      return `<a href="${href}" title="${title || ''}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">${text}</a>`;
    };

    renderer.image = ({ href, title, text }) => {
      let alignClass = 'img-center'; // Default to center
      let src = href;

      if (src.endsWith('#left')) {
          alignClass = 'img-left';
          src = src.slice(0, -5); // Remove '#left' from src
      } else if (src.endsWith('#right')) {
          alignClass = 'img-right';
          src = src.slice(0, -6); // Remove '#right' from src
      } else if (src.endsWith('#center')) {
          src = src.slice(0, -7); // Remove '#center' from src
      }
      
      return `<img src="${src}" alt="${text || 'User-embedded image'}" class="my-4 rounded-lg shadow-md max-w-full h-auto ${alignClass}" loading="lazy">`;
    };

    // Override heading rendering to add IDs and anchor links
    renderer.heading = ({ text, depth }) => {
      const escapedText = slugify(text, { lower: true, strict: true });
      return `
        <h${depth} id="${escapedText}" class="group relative text-2xl font-bold mb-6 dark:text-white">
          <a href="#${escapedText}" class="absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-50 transition-opacity" aria-hidden="true">
            <span class="text-gray-400 dark:text-gray-600">🔗</span>
          </a>
          ${text}
        </h${depth}>
      `;
    };

    // 1. Parse Markdown to HTML
    const rawHtml = marked.parse(article.content, { renderer });

    // 2. Sanitize the HTML (prevent XSS)
    // We strictly allow specific attributes to preserve your custom styling and logic
    const htmlContent = DOMPurify.sanitize(rawHtml, {
      ADD_TAGS: ['img'], // Ensure images are allowed
      ADD_ATTR: ['target', 'class', 'id', 'rel', 'loading'], // Allow attributes used in your custom renderer
    });

    // --- END OF NEW CODE ---

    const pageUrl = `${process.env.BASE_URL}/articles/${article.slug}`;
    res.locals.seo = {
      title: `${article.title} | Artsy Thoughts`,
      description: article.excerpt || truncateText(article.content),
      url: pageUrl,
      image: article.headerImageUrl || `${process.env.BASE_URL}/default-share-image.jpg`,
      type: 'article',
      // For structured data
      publishedDate: article.createdAt.toISOString(),
      modifiedDate: article.updatedAt.toISOString(),
      authorName: article.author.name
    };
    // --- END OF SEO DATA ---

    res.render('pages/articles/show', { article, htmlContent, user: req.user });


  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
};


export const renderHomepage = async (req, res) => {
  try {
    const canViewHidden = req.user && (req.user.role === 'ADMIN' || req.user.role === 'MODERATOR');
    const visibilityFilter = canViewHidden ? {} : { hidden: false };

    const featuredArticles = await prisma.article.findMany({
      where: { published: true, isFeatured: true, ...visibilityFilter },
      include: { author: true },
      orderBy: { createdAt: 'desc' },
    });

    const popularArticles = await prisma.article.findMany({
      where: { published: true, ...visibilityFilter },
      include: { author: true },
      orderBy: { viewCount: 'desc' },
      take: 5,
    });

    const latestArticles = await prisma.article.findMany({
      where: { published: true, ...visibilityFilter },
      include: { author: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // --- START OF SEO DATA ---
    res.locals.seo = {
      title: 'Artsy Thoughts | A Creative Blog',
      description: 'Welcome to Artsy Thoughts, a creative space for artistic ideas, tutorials, and inspiration.',
      url: process.env.BASE_URL,
      image: `${process.env.BASE_URL}/default-share-image.jpg`,
      type: 'website'
    };
    // --- END OF SEO DATA ---


    res.render('pages/home', {
      user: req.user,
      featuredArticles,
      popularArticles,
      latestArticles
    });
  } catch (error) {
    console.error('Error fetching homepage articles:', error);
    res.status(500).send('Error loading homepage');
  }
};

// Lists all published articles, sorted by most recent
export const listAllArticles = async (req, res) => {
  try {
    const canViewHidden = req.user && (req.user.role === 'ADMIN' || req.user.role === 'MODERATOR');
    const visibilityFilter = canViewHidden ? {} : { hidden: false };

    const articles = await prisma.article.findMany({
      where: { published: true, ...visibilityFilter },
      include: { author: true },
      orderBy: { createdAt: 'desc' },
    });

    res.render('pages/articles/all', {
      user: req.user,
      articles,
      pageTitle: 'All Articles'
    });
  } catch (error) {
    console.error('Error fetching all articles:', error);
    res.status(500).send('Error loading articles');
  }
};


export const toggleFeaturedStatus = async (req, res) => {
  try {
    const { slug } = req.params;
    const article = await prisma.article.findUnique({
      where: { slug },
    });

    if (!article) {
      return res.status(404).send('Article not found');
    }

    await prisma.article.update({
      where: { slug },
      data: { isFeatured: !article.isFeatured },
    });

    res.redirect(`/articles/${slug}`);
  } catch (error) {
    console.error('Error toggling featured status:', error);
    res.redirect(`/articles/${slug}`);
  }
};

// NEW: Toggles the hidden status of an article
export const toggleHiddenStatus = async (req, res) => {
  try {
    const { slug } = req.params;
    const article = await prisma.article.findUnique({
      where: { slug },
    });

    if (!article) {
      return res.status(404).send('Article not found');
    }

    await prisma.article.update({
      where: { slug },
      data: { hidden: !article.hidden },
    });

    res.redirect(`/articles/${slug}`);
  } catch (error) {
    console.error('Error toggling hidden status:', error);
    res.redirect(`/articles/${slug}`);
  }
};

export const renderMyArticles = async (req, res) => {
  try {
    const userId = req.user.id;
    const myArticles = await prisma.article.findMany({
      where: { authorId: userId },
      orderBy: { updatedAt: 'desc' },
    });

    res.render('pages/articles/my-articles', {
      user: req.user,
      articles: myArticles,
      pageTitle: 'My Articles'
    });
  } catch (error) {
    console.error('Error fetching user articles:', error);
    res.redirect('/');
  }
};


// Renders the form to edit an existing article
export const renderEditForm = async (req, res) => {
  try {
    const { slug } = req.params;
    const article = await prisma.article.findUnique({
      where: { slug },
    });

    if (!article) {
      return res.status(404).send('Article not found');
    }

    if (req.user.id !== article.authorId && req.user.role !== 'ADMIN' && req.user.role !== 'MODERATOR') {
      return res.status(403).send('Forbidden: You do not have permission to edit this article.');
    }


    res.render('pages/articles/edit', { article, user: req.user });
  } catch (error) {
    console.error('Error rendering edit form:', error);
    res.status(500).send('Server Error');
  }
};

// Handles the submission of the edit article form
export const updateArticle = async (req, res) => {
  try {
    const { slug } = req.params;
    const { title, content, excerpt, action } = req.body;

    const article = await prisma.article.findUnique({ where: { slug } });
    if (req.user.id !== article.authorId && req.user.role !== 'ADMIN' && req.user.role !== 'MODERATOR') {
      return res.status(403).send('Forbidden');
    }

    const finalSlug = await generateUniqueSlug(title);
       const updateData = {
      title,
      content,
      excerpt,
      slug: finalSlug,
      published: action === 'publish',
    };

    // Handle new header image upload
    if (req.file) {
      const { publicUrl, fileName } = await processAndUploadImage(
        req.file.buffer,
        req.file.originalname,
        { resize: { width: 960, height: 540 } }
      );
      updateData.headerImageUrl = publicUrl;
      await prisma.uploadedFile.create({
        data: { url: publicUrl, fileName, userId: req.user.id },
      });
    }

    const updatedArticle = await prisma.article.update({
      where: { slug },
      data: updateData,
    });

    res.redirect(`/articles/${updatedArticle.slug}`);
  } catch (error) {
    console.error('Error updating article:', error);
    res.redirect(`/`);
  }
};



// In controllers/articleController.js

export const getLeaderboard = async (req, res) => {
  try {
    // 1. Fetch all users and include their articles (only the views field is needed)
    const authors = await prisma.user.findMany({
      include: {
        articles: {
          select: { viewCount: true }, 
          where: { published: true }
        }
      }
    });

    // 2. Calculate total views for each author
    const leaderboard = authors.map(author => {
      const totalViews = author.articles.reduce((sum, article) => sum + (article.viewCount || 0), 0);
      
      return {
        username: author.name, // or author.name, depending on your schema
        articleCount: author.articles.length,
        totalViews: totalViews
      };
    });

    // 3. Sort authors by total views (Highest to Lowest)
    leaderboard.sort((a, b) => b.totalViews - a.totalViews);

    // 4. Render the view
    res.render('pages/leaderboard', { authors: leaderboard, user: req.user });
    
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).render('articles/index', { articles: [], error: 'Could not load leaderboard' }); // Fallback
  }
};
