'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Logo from '@/components/assets/Logo';
import Button from '@/components/fundations/elements/Button';
import Wrapper from '@/components/fundations/containers/Wrapper';
import { Burger } from '@/components/fundations/icons/Icons';

const links = [
  { href: '/', text: 'Websites' },
  { href: '/pricing/', text: 'Pricing' },
  { href: '/blog/', text: 'Blog' },
  { href: '/store/', text: 'Store' },
  { href: '/submit/', text: 'Submit' },
  { href: '/advertise/', text: 'Sponsors' },
  { href: '/system/overview', text: 'Overview' },
  { href: 'https://lexingtonthemes.com/templates/carbon', text: 'Buy Carbon' },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [open]);

  return (
    <nav ref={navRef} className="fixed inset-x-0 top-0 z-40 bg-white md:hidden">
      <Wrapper variant="standard" className="py-3">
        <div className="flex items-center justify-between">
          <Link href="/" aria-label="Go to homepage">
            <Logo className="h-4 text-base-900" />
          </Link>
          <Button
            iconOnly
            size="xs"
            variant="default"
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label="Open menu"
            icon={<Burger className="size-4" />}
          />
        </div>
      </Wrapper>
      {open && (
        <div className="bg-white">
          <Wrapper variant="standard" className="py-4">
            <div className="flex flex-col">
              {links.map((link) => (
                <Link
                  key={link.href}
                  className="text-base-900 text-lg font-medium py-1 border-b border-base-100 last:border-b-0"
                  href={link.href}
                >
                  {link.text}
                </Link>
              ))}
            </div>
            <div className="mt-8 flex items-center gap-2">
              <Button isLink size="xs" variant="muted" href="/signin" className="shrink-0">
                Sign in
              </Button>
              <Button isLink size="xs" variant="default" href="/signup" className="shrink-0">
                Sign up
              </Button>
            </div>
          </Wrapper>
        </div>
      )}
    </nav>
  );
}
