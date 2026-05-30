import { posts } from '#content';
import SiteShell from '@/components/global/SiteShell';
import Text from '@/components/fundations/elements/Text';
import Button from '@/components/fundations/elements/Button';
import Wrapper from '@/components/fundations/containers/Wrapper';
import BlogCard from '@/components/blog/BlogCard';

export default function BlogIndex() {
  const sortedPosts = [...posts].sort(
    (a, b) => +new Date(b.pubDate) - +new Date(a.pubDate),
  );
  const allTags = [...new Set(sortedPosts.flatMap((p) => p.tags || []))];
  const sortedTags = allTags.sort((a, b) => a.localeCompare(b));

  return (
    <SiteShell>
      <section>
        <Wrapper variant="standard" className="py-24 lg:pt-48">
          <div className="text-balance max-w-xl">
            <Text
              tag="h1"
              variant="displayLG"
              className="text-base-900 font-display font-medium tracking-tight"
            >
              Magazine
            </Text>
            <Text tag="p" variant="textBase" className="text-base-600 mt-4">
              You will find here the latest trends in the world of web development, design,
              and technology.
            </Text>
          </div>
          <div className="relative flex snap-x snap-proximity gap-1 py-2 px-2 overflow-x-scroll scrollbar-hide mt-12">
            {sortedTags.map((tag) => (
              <Button
                key={tag}
                isLink
                size="xs"
                title={tag}
                variant="muted"
                aria-label={tag}
                href={`/blog/tags/${tag}`}
                className="capitalize"
              >
                {tag}
              </Button>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 mt-8">
            {sortedPosts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        </Wrapper>
      </section>
    </SiteShell>
  );
}
