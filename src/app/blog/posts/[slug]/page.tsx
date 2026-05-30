import { notFound } from 'next/navigation';
import Image from 'next/image';
import { posts } from '#content';
import SiteShell from '@/components/global/SiteShell';
import Text from '@/components/fundations/elements/Text';
import Button from '@/components/fundations/elements/Button';
import Wrapper from '@/components/fundations/containers/Wrapper';
import BlogCard from '@/components/blog/BlogCard';

export function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  if (!post) notFound();

  const allPosts = [...posts].sort(
    (a, b) => +new Date(b.pubDate) - +new Date(a.pubDate),
  );

  return (
    <SiteShell>
      <section>
        <Wrapper variant="standard" className="py-24 lg:pt-48">
          <div className="text-balance">
            <div className="text-center max-w-3xl mx-auto text-balance">
              <Text
                tag="h1"
                variant="displayLG"
                className="text-base-900 font-display font-medium tracking-tight"
              >
                {post.title}
              </Text>
              <Text tag="p" variant="textBase" className="text-base-600 mt-4">
                {post.description}
              </Text>
            </div>
            <div className="flex flex-wrap items-center gap-1 mt-8 justify-center">
              {post.tags.map((tag) => (
                <Button
                  key={tag}
                  isLink
                  title={tag}
                  size="sm"
                  variant="muted"
                  aria-label={tag}
                  href={`/blog/tags/${tag}`}
                  className="text-accent-500 font-medium text-xs hover:text-base-900 capitalize"
                >
                  {tag}
                </Button>
              ))}
            </div>
          </div>
          <div className="p-8 bg-base-50 rounded-lg mt-12">
            <Image
              width={1400}
              height={1400}
              loading="lazy"
              src={post.image.url}
              alt={post.image.alt || post.title}
              className="size-full aspect-[8/5] object-top rounded shadow object-cover"
            />
          </div>
          <Wrapper variant="narrow" className="mt-12">
            <Wrapper variant="prose">
              <div dangerouslySetInnerHTML={{ __html: post.body }} />
            </Wrapper>
          </Wrapper>
        </Wrapper>
      </section>
      <section>
        <Wrapper variant="standard" className="py-12">
          <div className="flex flex-wrap gap-4 justify-between items-center">
            <Text
              tag="h2"
              variant="displaySM"
              className="text-base-900 font-display font-medium tracking-tight"
            >
              Latest posts
            </Text>
            <Button isLink size="sm" variant="muted" href="/blog/">
              See all posts
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 mt-8">
            {allPosts.slice(0, 3).map((p) => (
              <BlogCard key={p.slug} post={p} />
            ))}
          </div>
        </Wrapper>
      </section>
    </SiteShell>
  );
}
