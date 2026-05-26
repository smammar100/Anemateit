import SiteShell from '@/components/global/SiteShell';
import Text from '@/components/fundations/elements/Text';
import Wrapper from '@/components/fundations/containers/Wrapper';

export default function HowItWorksPage() {
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
              How it works
            </Text>
            <Text tag="p" variant="textBase" className="text-base-600 mt-4 text-balance">
              Most animation showcases hand you a CodePen link and wish you luck. Anemate.dev
              treats the prompt as the deliverable — so the effect lands cleanly inside the
              tool you already use.
            </Text>
            <Wrapper variant="prose" className="mt-12">
              <h4>The prompt is the deliverable</h4>
              <p>
                Every animation ships with one artifact: a self-contained prompt. It names
                the props, walks the AI through the mental model, and lists the knobs you
                can tweak. The video shows the result. The prompt makes it yours.
              </p>
              <h4>Drop it into your tool</h4>
              <p>
                Paste the prompt into Claude Code, Cursor, v0, Lovable, or Bolt. The
                animation regenerates in your stack — same effect, your component
                conventions, your file structure. No CodePen surgery, no half-broken
                output.
              </p>
              <h4>Built to drop in cleanly</h4>
              <p>
                Each entry is written for low-code AI tools: one file, named props, a short
                mental-model section, and clear tweak knobs. If you live in v0 or Lovable,
                it just works. If you write your own React, the structure stays out of your
                way.
              </p>
            </Wrapper>
          </Wrapper>
        </Wrapper>
      </section>
    </SiteShell>
  );
}
