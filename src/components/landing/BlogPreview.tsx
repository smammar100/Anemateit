import { posts } from '#content';
import Text from '@/components/fundations/elements/Text';
import Button from '@/components/fundations/elements/Button';
import Wrapper from '@/components/fundations/containers/Wrapper';
import BlogCard from '@/components/blog/BlogCard';

export default function BlogPreview() {
  const sortedPosts = [...posts]
    .sort((a, b) => +new Date(b.pubDate) - +new Date(a.pubDate))
    .slice(0, 3);

  return (
    <section>
      <Wrapper variant="standard" className="py-24">
        <div className="flex flex-wrap gap-4 justify-between items-center">
          <Text
            tag="h2"
            variant="displaySM"
            className="text-base-900 font-display font-thin"
          >
            Latest articles
          </Text>
          <Button isLink size="sm" variant="muted" href="/blog/">
            See all articles
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 mt-8">
          {sortedPosts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      </Wrapper>
    </section>
  );
}
