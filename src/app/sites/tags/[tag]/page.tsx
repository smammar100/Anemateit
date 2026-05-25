import { notFound } from 'next/navigation';
import { sites } from '#content';
import SiteShell from '@/components/global/SiteShell';
import Text from '@/components/fundations/elements/Text';
import Button from '@/components/fundations/elements/Button';
import Wrapper from '@/components/fundations/containers/Wrapper';
import SiteCard from '@/components/sites/SiteCard';

export function generateStaticParams() {
  const tags = [
    ...new Set(sites.flatMap((s) => (s.tags ?? []).filter(Boolean))),
  ] as string[];
  return tags.map((tag) => ({ tag }));
}

export default async function SiteTagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);
  const filtered = sites.filter((s) => s.tags?.includes(decodedTag));
  if (filtered.length === 0) notFound();

  const allTags = [
    ...new Set(sites.flatMap((s) => (s.tags ?? []).filter(Boolean))),
  ] as string[];
  const sortedTags = allTags.sort((a, b) => a.localeCompare(b));

  return (
    <SiteShell showSearch>
      <section>
        <Wrapper variant="standard" className="py-24 lg:pt-48">
          <Text
            tag="h1"
            variant="displayLG"
            className="text-base-900 font-display font-light text-center max-w-xl mx-auto text-balance"
          >
            Explore all sites related to {decodedTag}
          </Text>
          <div className="flex items-center gap-1 mt-24">
            <div className="relative flex snap-x snap-proximity gap-1 py-2 px-2 overflow-x-scroll scrollbar-hide">
              {sortedTags.map((t) => (
                <Button
                  key={t}
                  isLink
                  size="sm"
                  variant="muted"
                  title={t}
                  aria-label={t}
                  href={`/sites/tags/${t}`}
                  className="capitalize"
                >
                  {t}
                </Button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 mt-2">
            {filtered.map((s) => (
              <SiteCard key={s.slug} post={s} />
            ))}
          </div>
        </Wrapper>
      </section>
    </SiteShell>
  );
}
