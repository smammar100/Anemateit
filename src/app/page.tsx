import SiteShell from '@/components/global/SiteShell';
import Hero from '@/components/landing/Hero';
import SitesPreview from '@/components/landing/SitesPreview';

// Revalidate the homepage every 60s so newly-added Sanity projects appear
// without needing a fresh deploy.
export const revalidate = 60;

export default function HomePage() {
  return (
    <SiteShell showSearch>
      <Hero />
      <SitesPreview />
    </SiteShell>
  );
}
