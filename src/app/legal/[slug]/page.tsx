import { notFound } from 'next/navigation';
import { legal } from '#content';
import SiteShell from '@/components/global/SiteShell';
import Text from '@/components/fundations/elements/Text';
import Wrapper from '@/components/fundations/containers/Wrapper';

export function generateStaticParams() {
  return legal.map((page) => ({ slug: page.slug }));
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = legal.find((l) => l.slug === slug);
  if (!page) notFound();

  return (
    <SiteShell>
      <section>
        <Wrapper variant="standard" className="py-24 lg:pt-48">
          <div className="flex flex-col gap-12 lg:flex-row">
            <div className="text-balance lg:w-1/3">
              <Text
                tag="h1"
                variant="displayLG"
                className="text-base-900 font-display font-thin"
              >
                {page.page}
              </Text>
              <Text tag="p" variant="textBase" className="text-base-600 mt-4">
                Last updated on {page.pubDate.slice(0, 10)}
              </Text>
            </div>
            <div className="lg:w-1/2">
              <Wrapper variant="prose">
                <div dangerouslySetInnerHTML={{ __html: page.body }} />
              </Wrapper>
            </div>
          </div>
        </Wrapper>
      </section>
    </SiteShell>
  );
}
