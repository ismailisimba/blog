import { prisma } from '../services/prisma.js';
import slugify from 'slugify';
import { marked } from 'marked';
import { uploadFile } from '../services/storage.js';
import { truncateText } from '../utils/helpers.js'; 

// Renders the form to create a new article
export const renderCreateForm = (req, res) => {
  res.render('pages/articles/create', { user: req.user });
};

// Handles the submission of the new article form
export const createArticle = async (req, res) => {
  try {
    const { title, content, excerpt, action } = req.body;
    let imageUrl = null;

    if (req.file) {
      const { publicUrl, fileName } = await uploadFile(req.file);
      imageUrl = publicUrl;

      // Save file metadata to the database
      await prisma.uploadedFile.create({
        data: {
          url: publicUrl,
          fileName: fileName,
          userId: req.user.id,
        },
      });
    }

    const newArticle = await prisma.article.create({
      data: {
        title,
        content,
        excerpt,
        headerImageUrl: imageUrl,
        slug: slugify(title, { lower: true, strict: true }),
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
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];

    // Override how links are rendered
    renderer.link = (href) => {
      const title = href.title || '';
      const text = href.text || '';
      const isImageUrl = imageExtensions.some(ext => href.href.toLowerCase().endsWith(ext));
      
      // If the link is an image URL and the text is just the URL itself, render it as an image.
      if (isImageUrl ) {
        return `<img src="${href.href}" alt="User-embedded image" class="my-4 rounded-lg shadow-md max-w-full h-auto" loading="lazy">`;
      }
      
      // Otherwise, render as a normal link.
      // The `target="_blank"` opens the link in a new tab.
      return `<a href="${href.href}" title="${title || ''}" target="_blank" rel="noopener noreferrer" class="text-green-500">${text}</a>`;
    };

    // Override heading rendering to add IDs and anchor links
    renderer.heading = (textObj) => {
      const text = textObj.text || '';
      const level = parseInt(textObj.depth, 10);
      const escapedText = slugify(text, { lower: true, strict: true });
      return `
        <h${level} id="${escapedText}" class="group relative text-2xl font-bold mb-6 dark:text-white">
          <a href="#${escapedText}" class="absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-50 transition-opacity" aria-hidden="true">
            <span class="text-gray-400 dark:text-gray-600">🔗</span>
          </a>
          ${text}
        </h${level}>
      `;
    };
    
    // Use the custom renderer when parsing the markdown
    const htmlContent = marked.parse(article.content, { renderer });
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

    const newSlug = slugify(title, { lower: true, strict: true });

    const updatedArticle = await prisma.article.update({
      where: { slug },
      data: {
        title,
        content,
        excerpt,
        slug: newSlug,
        published: action === 'publish',
      },
    });

    res.redirect(`/articles/${updatedArticle.slug}`);
  } catch (error) {
    console.error('Error updating article:', error);
    res.redirect(`/`);
  }
};
