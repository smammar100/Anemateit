import SiteShell from '@/components/global/SiteShell';
import Text from '@/components/fundations/elements/Text';
import Button from '@/components/fundations/elements/Button';
import Wrapper from '@/components/fundations/containers/Wrapper';

export default function SubmitPage() {
  return (
    <SiteShell>
      <section>
        <Wrapper variant="standard" className="py-24 lg:pt-48">
          <Wrapper variant="narrow">
            <div className="text-balance">
              <Text
                tag="h1"
                variant="displayMD"
                className="text-base-900 font-display font-medium tracking-tight"
              >
                Submit your animation to Anemate.dev
              </Text>
              <Text tag="p" variant="textBase" className="mt-2 text-base-600 text-balance">
                Built a motion effect that holds up inside real product UI? Send it our
                way — we&apos;ll wrap it in a paste-ready prompt and put it in front of
                AI-native builders.
              </Text>
            </div>
            <Wrapper variant="prose" className="mt-12">
              <h4>What we&apos;re looking for</h4>
              <p>
                Production-grade motion: one file, named props, clean dependencies, and an
                effect that survives a real UI context. Showy demos don&apos;t make the
                cut. If the prompt can&apos;t be written cleanly, it isn&apos;t the right
                fit.
              </p>
              <h4>Submission process</h4>
              <p>
                Free submissions get reviewed in the queue — high volume, no guarantees. For
                $99 you skip the line and receive a review within 7 days, though publication
                is still based on fit. Selected animations are rewritten into our prompt
                format with credit to you.
              </p>
              <div className="flex items-center not-prose gap-2">
                <Button size="sm" variant="default" className="w-fit">
                  Submit an animation
                </Button>
                <Button isLink size="sm" variant="accent" href="/pricing" className="w-fit">
                  Skip the waiting line for $99
                </Button>
              </div>
              <h4>If not selected</h4>
              <p>
                We&apos;ll tell you why. Most rejections come down to fit — refine the
                effect or try again with the next one.
              </p>
            </Wrapper>
          </Wrapper>
        </Wrapper>
      </section>
    </SiteShell>
  );
}
