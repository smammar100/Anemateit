import SiteShell from '@/components/global/SiteShell';
import Text from '@/components/fundations/elements/Text';
import Wrapper from '@/components/fundations/containers/Wrapper';

export default function AboutPage() {
  return (
    <SiteShell>
      <section>
        <Wrapper variant="standard" className="py-24 lg:pt-48">
          <Wrapper variant="narrow">
            <Text
              tag="h1"
              variant="displayLG"
              className="text-base-900 font-display font-thin"
            >
              Who we are
            </Text>
            <Wrapper variant="prose" className="mt-12">
              <p>
                Anemate.dev is a curated library of web animations built for how people
                actually ship UI in 2026 — inside Claude Code, Cursor, v0, Lovable, and
                Bolt. Every entry ships with a paste-ready prompt, not a CodePen link.
              </p>
              <p>
                Most animation showcases assume you write your own React. That falls apart
                the moment you live in a low-code AI tool, where copying a snippet and
                praying ends in half-broken output. So we treat the prompt as the
                deliverable: one file, named props, a short mental model, clear tweak
                knobs.
              </p>
              <p>
                We skew toward motion that holds up in real product UI — not demo reels.
                Ship something good with it, that&apos;s the whole point.
              </p>
            </Wrapper>
            <div className="mt-12">
              <Text className="text-base-600 italic">
                &quot;The video shows the result. The prompt makes it yours.&quot;
              </Text>
              <Text
                tag="p"
                variant="textBase"
                className="text-base-900 mt-2 font-semibold"
              >
                — The Anemate.dev team
              </Text>
            </div>
          </Wrapper>
        </Wrapper>
      </section>
    </SiteShell>
  );
}
