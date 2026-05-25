import { notFound } from 'next/navigation';
import Image from 'next/image';
import { sites } from '#content';
import SiteShell from '@/components/global/SiteShell';
import Text from '@/components/fundations/elements/Text';
import Button from '@/components/fundations/elements/Button';
import Wrapper from '@/components/fundations/containers/Wrapper';
import SiteCard from '@/components/sites/SiteCard';
import { ArrowUpRight } from '@/components/fundations/icons/Icons';

export function generateStaticParams() {
  return sites.map((s) => ({ slug: s.slug }));
}

export default async function SitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const site = sites.find((s) => s.slug === slug);
  if (!site) notFound();

  return (
    <SiteShell showSearch>
      <section>
        <Wrapper variant="standard" className="py-24">
          <div className="flex flex-wrap justify-between gap-4">
            <div className="max-w-xl text-balance">
              <Text
                tag="h1"
                variant="displayMD"
                className="text-base-900 font-display font-thin capitalize"
              >
                {site.title}
              </Text>
              <Text tag="p" variant="textSM" className="text-base-600 mt-4">
                {site.description}
              </Text>
            </div>
            <Button
              isLink
              iconOnly
              size="xs"
              variant="default"
              href={site.live}
              title={site.title}
              icon={<ArrowUpRight className="size-4" />}
            />
          </div>
          <div className="p-8 bg-base-50 rounded-lg mt-12">
            <Image
              width={1400}
              height={1400}
              loading="lazy"
              src={site.thumbnail.url}
              alt={site.thumbnail.alt || site.title}
              className="size-full aspect-[8/5] object-top rounded shadow"
            />
          </div>
          {site.details && (
            <dl className="mt-4 divide-y divide-base-100">
              {site.details.map((detail) => (
                <div
                  key={detail.label}
                  className="flex items-center gap-2 justify-between py-2"
                >
                  <dt>
                    <Text
                      tag="h3"
                      variant="textSM"
                      className="text-base-900 font-medium"
                    >
                      {detail.label}
                    </Text>
                  </dt>
                  <dd>
                    <Text tag="p" variant="textSM" className="text-base-600">
                      {detail.value}
                    </Text>
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </Wrapper>
      </section>
      <section>
        <Wrapper variant="standard" className="py-24">
          <div className="flex flex-wrap gap-4 justify-between items-center">
            <Text
              tag="h2"
              variant="displaySM"
              className="text-base-900 font-display font-thin"
            >
              Latest additions
            </Text>
            <Button isLink size="sm" variant="muted" href="/sites/">
              See all tools
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 mt-8">
            {sites.slice(0, 4).map((s) => (
              <SiteCard key={s.slug} post={s} />
            ))}
          </div>
        </Wrapper>
      </section>
    </SiteShell>
  );
}
