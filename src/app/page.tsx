import SiteShell from '@/components/global/SiteShell';
import Hero from '@/components/landing/Hero';
import SitesPreview from '@/components/landing/SitesPreview';
import BlogPreview from '@/components/landing/BlogPreview';
import StorePreview from '@/components/landing/StorePreview';

export default function HomePage() {
  return (
    <SiteShell showSearch>
      <Hero />
      <SitesPreview />
      <BlogPreview />
      <StorePreview />
    </SiteShell>
  );
}
