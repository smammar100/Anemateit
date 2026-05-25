import type { ReactNode } from 'react';
import Navigation from '@/components/navigation/Navigation';
import Footer from '@/components/global/Footer';
import Search from '@/components/sites/Search';

type Props = {
  children: ReactNode;
  hideNavigation?: boolean;
  hideFooter?: boolean;
  showSearch?: boolean;
};

export default function SiteShell({
  children,
  hideNavigation = false,
  hideFooter = false,
  showSearch = false,
}: Props) {
  return (
    <>
      {!hideNavigation && <Navigation />}
      <main className="grow">
        {showSearch && <Search />}
        {children}
      </main>
      {!hideFooter && <Footer />}
    </>
  );
}
