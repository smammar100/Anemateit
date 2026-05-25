import { store } from '#content';
import Text from '@/components/fundations/elements/Text';
import Button from '@/components/fundations/elements/Button';
import Wrapper from '@/components/fundations/containers/Wrapper';
import StoreCard from '@/components/store/StoreCard';

export default function StorePreview() {
  const items = store.slice(0, 3);
  return (
    <section>
      <Wrapper variant="standard" className="py-24">
        <div className="flex flex-wrap gap-4 justify-between items-center">
          <Text
            tag="h2"
            variant="displaySM"
            className="text-base-900 font-display font-thin"
          >
            Our latest templates
          </Text>
          <Button isLink size="sm" variant="muted" href="/store/">
            See them all!
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 mt-12">
          {items.map((post) => (
            <StoreCard key={post.slug} post={post} />
          ))}
        </div>
      </Wrapper>
    </section>
  );
}
