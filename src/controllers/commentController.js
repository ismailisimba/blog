import { prisma } from '../services/prisma.js';

export const createComment = async (req, res) => {
  try {
    const { slug } = req.params;
    const { text } = req.body;
    const userId = req.user.id;

    // First, find the article by its slug to get its ID
    const article = await prisma.article.findUnique({
      where: { slug },
      select: { id: true }, // We only need the ID
    });

    if (!article) {
      return res.status(404).send('Article not found.');
    }

    // Now create the comment
    await prisma.comment.create({
      data: {
        text,
        authorId: userId,
        articleId: article.id,
      },
    });

    res.redirect(`/articles/${slug}`);
  } catch (error) {
    console.error('Error posting comment:', error);
    res.redirect(`/articles/${slug}`);
  }
};
