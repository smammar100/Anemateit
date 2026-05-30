import { notFound } from 'next/navigation';
import { posts } from '#content';
import SiteShell from '@/components/global/SiteShell';
import Text from '@/components/fundations/elements/Text';
import Wrapper from '@/components/fundations/containers/Wrapper';
import BlogCard from '@/components/blog/BlogCard';

export function generateStaticParams() {
  const tags = [...new Set(posts.flatMap((p) => p.tags))];
  return tags.map((tag) => ({ tag }));
}

export default async function BlogTagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);
  const filtered = posts.filter((p) => p.tags.includes(decodedTag));
  if (filtered.length === 0) notFound();

  return (
    <SiteShell>
      <section className="relative overflow-hidden">
        <Wrapper variant="standard" className="py-24 lg:pt-48">
          <Text
            tag="h1"
            variant="displayLG"
            className="text-base-900 font-display font-medium tracking-tight"
          >
            All blog posts about {decodedTag}
          </Text>
          <div className="grid grid-cols-1 gap-px gap-y-12 md:grid-cols-2 lg:grid-cols-3 group mt-8">
            {filtered.slice(0, 3).map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        </Wrapper>
      </section>
    </SiteShell>
  );
}
