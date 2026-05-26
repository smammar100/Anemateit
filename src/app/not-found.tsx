import SiteShell from '@/components/global/SiteShell';
import Text from '@/components/fundations/elements/Text';
import Button from '@/components/fundations/elements/Button';
import Wrapper from '@/components/fundations/containers/Wrapper';

export default function NotFound() {
  return (
    <SiteShell>
      <section>
        <Wrapper
          variant="standard"
          className="py-24 flex flex-col h-full lg:h-dvh items-center justify-center"
        >
          <div className="max-w-xl mx-auto text-balance">
            <div className="text-center">
              <Text
                tag="h1"
                variant="displayLG"
                className="text-base-900 font-display font-light"
              >
                Error 404
              </Text>
              <Text tag="p" variant="textBase" className="text-base-600 mt-4">
                This animation must have unmounted. The page you&apos;re looking for has
                moved, been renamed, or never existed in the first place.
              </Text>
            </div>
            <Button isLink size="base" variant="default" href="/" className="mt-12 w-fit mx-auto">
              Go back home
            </Button>
          </div>
        </Wrapper>
      </section>
    </SiteShell>
  );
}
