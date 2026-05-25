import { posts } from '#content';
import SiteShell from '@/components/global/SiteShell';
import Text from '@/components/fundations/elements/Text';
import Button from '@/components/fundations/elements/Button';
import Wrapper from '@/components/fundations/containers/Wrapper';

export default function TagsIndex() {
  const tags = [...new Set(posts.flatMap((p) => p.tags))];
  return (
    <SiteShell>
      <section>
        <Wrapper variant="narrow" className="py-24 lg:pt-48">
          <Text
            tag="h1"
            variant="displayLG"
            className="text-base-900 font-display font-thin text-center"
          >
            Explore all tags
          </Text>
          <ul role="list" className="flex flex-col gap-1 mt-12">
            {tags.map((tag) => (
              <Button
                key={tag}
                isLink
                size="sm"
                variant="muted"
                title={tag}
                aria-label={tag}
                href={`/blog/tags/${tag}`}
                className="capitalize"
              >
                {tag}
              </Button>
            ))}
          </ul>
        </Wrapper>
      </section>
    </SiteShell>
  );
}
