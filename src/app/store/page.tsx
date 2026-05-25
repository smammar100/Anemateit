import { store } from '#content';
import SiteShell from '@/components/global/SiteShell';
import Text from '@/components/fundations/elements/Text';
import Wrapper from '@/components/fundations/containers/Wrapper';
import StoreCard from '@/components/store/StoreCard';

export default function StoreIndex() {
  return (
    <SiteShell>
      <section>
        <Wrapper variant="standard" className="py-24 lg:pt-48">
          <div className="text-balance max-w-xl text-center mx-auto">
            <Text
              tag="h1"
              variant="displayLG"
              className="text-base-900 font-display font-thin"
            >
              Our products
            </Text>
            <Text tag="p" variant="textBase" className="text-base-600 mt-4">
              Shop my selection of digital products to help you grow your business, and to
              make your life easier and more productive
            </Text>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 mt-12">
            {store.map((post) => (
              <StoreCard key={post.slug} post={post} />
            ))}
          </div>
        </Wrapper>
      </section>
    </SiteShell>
  );
}
