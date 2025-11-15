import { prisma } from '../services/prisma.js';
import slugify from 'slugify';
import { marked } from 'marked';
import { uploadFile } from '../services/storage.js';

// Renders the form to create a new article
export const renderCreateForm = (req, res) => {
  res.render('pages/articles/create', { user: req.user });
};

// Handles the submission of the new article form
// Handles the submission of the new article form
export const createArticle = async (req, res) => {
  try {
    const { title, content } = req.body;
    let imageUrl = null;

    // Check if a file was uploaded
    if (req.file) {
      imageUrl = await uploadFile(req.file);
    }

    const newArticle = await prisma.article.create({
      data: {
        title,
        content,
        headerImageUrl: imageUrl, // Save the URL to the database
        slug: slugify(title, { lower: true, strict: true }),
        authorId: req.user.id,
        published: true,
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
        const articleData = await prisma.article.findUnique({
      where: { slug },
      include: { author: true,
         comments: {
          include: {
            author: true,
          },
          orderBy: {
            createdAt: 'asc', // Show oldest comments first
          },
        },
       }, // Include the author's details
    });

    if (!articleData) return null;

      // 2. Increment the view count
      await tx.article.update({
        where: { slug },
        data: { viewCount: { increment: 1 } },
      });

      return articleData;


    })

    if (!article) {
      return res.status(404).send('Article not found');
    }

    const htmlContent = marked.parse(article.content);

    res.render('pages/articles/show', { article, htmlContent, user: req.user });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
};


export const renderHomepage = async (req, res) => {
  try {
    const featuredArticles = await prisma.article.findMany({
      where: { published: true, isFeatured: true },
      include: { author: true },
      orderBy: { createdAt: 'desc' },
    });

    const popularArticles = await prisma.article.findMany({
      where: { published: true },
      include: { author: true },
      orderBy: { viewCount: 'desc' },
      take: 5, // Get the top 5 most popular
    });
    
    // Fetch a list of the latest articles as the main feed
    const latestArticles = await prisma.article.findMany({
      where: { published: true },
      include: { author: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

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

