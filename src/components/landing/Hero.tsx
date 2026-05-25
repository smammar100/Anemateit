import Text from '@/components/fundations/elements/Text';
import Wrapper from '@/components/fundations/containers/Wrapper';

export default function Hero() {
  return (
    <section>
      <Wrapper variant="standard" className="pt-24 lg:pt-48">
        <div className="text-balance max-w-3xl mx-auto text-center">
          <Text
            tag="h1"
            variant="displayLG"
            className="text-base-900 font-display font-light"
          >
            <span className="block">Don&apos;t copy code.</span>
            <span className="block">Copy the prompt.</span>
          </Text>
          <Text tag="p" variant="textBase" className="text-base-600 mt-4">
            A curated library of premium web animations. Each one ships with an AI
            prompt you can paste into Claude Code, Cursor, v0, or Lovable to
            regenerate it in your own stack.
          </Text>
        </div>
      </Wrapper>
    </section>
  );
}
