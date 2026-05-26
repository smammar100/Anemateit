import Link from 'next/link';
import Logo from '@/components/assets/Logo';
import Wrapper from '@/components/fundations/containers/Wrapper';
import MobileNav from './MobileNav';
import { navLinks } from '@/lib/navigation';

export default function Navigation() {
  return (
    <>
      <MobileNav />
      <nav className="fixed w-full top-0 z-20 bg-white py-4 hidden md:block">
        <Wrapper variant="standard">
          <div className="grid grid-cols-2 md:grid-cols-2 items-center w-full gap-3 relative">
            <Link href="/" className="shrink-0 focus:outline-none" aria-label="Go to homepage">
              <Logo className="h-4 text-base-900" />
            </Link>
            <div className="flex items-center gap-2 lg:gap-2 ml-auto">
              <div className="flex items-center gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    className="text-base-600 hover:text-base-900 text-xs whitespace-nowrap"
                    href={link.href}
                  >
                    {link.text}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </Wrapper>
      </nav>
    </>
  );
}
