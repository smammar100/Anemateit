import RSS from 'rss';
import { posts } from '#content';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com';

export async function GET() {
  const feed = new RSS({
    title: 'Lexington Themes',
    description:
      'Free and premium multipage themes and UI Kits For freelancers, developers, businesses, and personal use. Beautifully crafted with Tailwind CSS — Simple & easy to customise.',
    site_url: SITE_URL,
    feed_url: `${SITE_URL}/rss.xml`,
  });

  const sortedPosts = [...posts].sort(
    (a, b) => +new Date(b.pubDate) - +new Date(a.pubDate),
  );

  for (const post of sortedPosts) {
    feed.item({
      title: post.title,
      description: post.description,
      url: `${SITE_URL}/blog/posts/${post.slug}`,
      date: post.pubDate,
    });
  }

  return new Response(feed.xml({ indent: true }), {
    headers: { 'Content-Type': 'application/xml' },
  });
}
