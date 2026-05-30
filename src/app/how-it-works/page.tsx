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
              className="text-base-900 font-display font-medium tracking-tight"
            >
              About us
            </Text>
            <Text tag="p" variant="textBase" className="text-base-600 mt-4 text-balance">
              Anemate.dev is a curated library of web animations — each one packaged as a
              prompt you can drop straight into your stack. We're a small crew of designers
              and engineers who got tired of watching great motion stay trapped in demos.
            </Text>
            <Wrapper variant="prose" className="mt-12">
              <h4>Where we started</h4>
              <p>
                Beautiful effects were everywhere, but they never traveled well. Copying a
                CodePen meant untangling someone else's markup, build, and assumptions — and
                hoping it survived the move. So we flipped the model: instead of you chasing
                the code, the animation comes to you, in your framework and your conventions.
              </p>
              <h4>What we believe</h4>
              <p>
                Motion is part of the interface, not an afterthought bolted on at the end.
                Everything we publish is production-minded — clear props, a short mental
                model, and honest tweak knobs. If an effect can't ship cleanly, it doesn't
                make the cut.
              </p>
              <h4>Built with the community</h4>
              <p>
                The library grows from the people who use it as much as from us. Spot an
                effect worth sharing? Request it, and we'll credit you as the inspiration
                when it lands. We're building the reference we always wished existed — come
                build it with us.
              </p>
            </Wrapper>
          </Wrapper>
        </Wrapper>
      </section>
    </SiteShell>
  );
}
