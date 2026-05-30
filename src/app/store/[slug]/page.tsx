import { notFound } from 'next/navigation';
import Image from 'next/image';
import { store } from '#content';
import SiteShell from '@/components/global/SiteShell';
import Text from '@/components/fundations/elements/Text';
import Button from '@/components/fundations/elements/Button';
import Wrapper from '@/components/fundations/containers/Wrapper';
import StoreCard from '@/components/store/StoreCard';
import { Checkout } from '@/components/fundations/icons/Icons';

export function generateStaticParams() {
  return store.map((s) => ({ slug: s.slug }));
}

export default async function StoreItemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = store.find((s) => s.slug === slug);
  if (!item) notFound();

  return (
    <SiteShell>
      <section>
        <Wrapper variant="standard" className="py-24 lg:pt-48">
          <div>
            <div className="flex flex-wrap justify-between gap-4">
              <div className="max-w-xl text-balance">
                <Text
                  tag="h1"
                  variant="displayLG"
                  className="text-base-900 font-display font-medium tracking-tight"
                >
                  {item.title}
                </Text>
                <Text tag="p" variant="textBase" className="text-base-600 mt-4">
                  {item.description}
                </Text>
              </div>
              <Button
                isLink
                iconOnly
                size="xs"
                variant="default"
                href={item.checkout}
                title={item.title}
                icon={<Checkout className="size-4" />}
              />
            </div>
            <div className="p-8 bg-base-50 rounded-lg mt-12">
              <Image
                width={1400}
                height={1400}
                loading="lazy"
                src={item.image.url}
                alt={item.image.alt || item.title}
                className="size-full aspect-[8/5] object-top rounded shadow"
              />
            </div>
            <dl className="mt-4 divide-y divide-base-100">
              {item.features.map((feature) => (
                <div
                  key={feature.title}
                  className="flex items-center gap-2 justify-between py-2"
                >
                  <dt>
                    <Text
                      tag="h3"
                      variant="textSM"
                      className="text-base-900 font-medium"
                    >
                      {feature.title}
                    </Text>
                  </dt>
                  <dd className="mt-1">
                    <Text tag="p" variant="textSM" className="text-base-600">
                      {feature.description}
                    </Text>
                  </dd>
                </div>
              ))}
              <div className="flex items-start gap-2 justify-between py-2">
                <dt>
                  <Text
                    tag="h3"
                    variant="textSM"
                    className="text-base-900 font-medium"
                  >
                    Details
                  </Text>
                </dt>
                <dd>
                  <ul role="list">
                    {item.highlights.map((highlight) => (
                      <li key={highlight}>
                        <Text tag="p" variant="textSM" className="text-base-600">
                          {highlight}
                        </Text>
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
              <Text tag="p" variant="textSM" className="text-base-600 mt-4">
                {item.license}
              </Text>
            </dl>
          </div>
          {item.gallery && item.gallery.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {item.gallery.map((img, i) => (
                <div key={i} className="p-8 bg-base-50 rounded-lg mt-12">
                  <Image
                    width={1400}
                    height={1400}
                    loading="lazy"
                    src={img.url}
                    alt={img.alt || item.title}
                    className="size-full aspect-[8/5] object-top rounded shadow"
                  />
                </div>
              ))}
            </div>
          )}
        </Wrapper>
      </section>
      <section>
        <Wrapper variant="standard" className="py-24">
          <div className="flex flex-wrap gap-4 justify-between items-center">
            <Text
              tag="h2"
              variant="displaySM"
              className="text-base-900 font-display font-medium tracking-tight"
            >
              More products
            </Text>
            <Button isLink size="sm" variant="muted" href="/store/">
              See all products
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 mt-8">
            {store.slice(0, 3).map((s) => (
              <StoreCard key={s.slug} post={s} />
            ))}
          </div>
        </Wrapper>
      </section>
    </SiteShell>
  );
}
