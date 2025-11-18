import { prisma } from '../services/prisma.js';
import { marked } from 'marked';

// Generates and serves sitemap.xml
export const generateSitemap = async (req, res) => {
    try {
        const articles = await prisma.article.findMany({
            where: { published: true, hidden: false },
            select: { slug: true, updatedAt: true },
        });

        const baseUrl = process.env.BASE_URL;
        let xml = `<?xml version="1.0" encoding="UTF-8"?>`;
        xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

        // Add homepage
        xml += `<url><loc>${baseUrl}</loc><priority>1.0</priority></url>`;
        // Add all articles page
        xml += `<url><loc>${baseUrl}/articles</loc><priority>0.8</priority></url>`;

        articles.forEach(article => {
            const articleUrl = `${baseUrl}/articles/${article.slug}`;
            const lastMod = article.updatedAt.toISOString().split('T')[0]; // Format as YYYY-MM-DD
            xml += `<url><loc>${articleUrl}</loc><lastmod>${lastMod}</lastmod></url>`;
        });

        xml += `</urlset>`;
        
        res.header('Content-Type', 'application/xml');
        res.send(xml);
    } catch (error) {
        console.error("Sitemap generation error:", error);
        res.status(500).send("Error generating sitemap.");
    }
};

// Generates and serves feed.xml (RSS)
export const generateRssFeed = async (req, res) => {
    try {
        const articles = await prisma.article.findMany({
            where: { published: true, hidden: false },
            orderBy: { createdAt: 'desc' },
            take: 20, // Get the 20 most recent articles
            include: { author: true },
        });

        const baseUrl = process.env.BASE_URL;
        let xml = `<?xml version="1.0" encoding="UTF-8"?>`;
        xml += `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">`;
        xml += `<channel>`;
        xml += `<title>Artsy Thoughts</title>`;
        xml += `<link>${baseUrl}</link>`;
        xml += `<description>A creative space for artistic ideas and thoughts.</description>`;
        xml += `<language>en-us</language>`;
        xml += `<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`;
        xml += `<atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml" />`;

        articles.forEach(article => {
            const articleUrl = `${baseUrl}/articles/${article.slug}`;
            const description = article.excerpt || marked.parse(article.content.substring(0, 300) + '...');

            xml += `<item>`;
            xml += `<title><![CDATA[${article.title}]]></title>`;
            xml += `<link>${articleUrl}</link>`;
            xml += `<guid isPermaLink="true">${articleUrl}</guid>`;
            xml += `<pubDate>${new Date(article.createdAt).toUTCString()}</pubDate>`;
            xml += `<description><![CDATA[${description}]]></description>`;
            xml += `</item>`;
        });

        xml += `</channel></rss>`;
        
        res.header('Content-Type', 'application/xml');
        res.send(xml);
    } catch (error) {
        console.error("RSS feed generation error:", error);
        res.status(500).send("Error generating RSS feed.");
    }
};
