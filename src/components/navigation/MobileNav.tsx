'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Logo from '@/components/assets/Logo';
import Button from '@/components/fundations/elements/Button';
import RequestAnimationModal from './RequestAnimationModal';
import Wrapper from '@/components/fundations/containers/Wrapper';
import { Burger } from '@/components/fundations/icons/Icons';
import { navLinks } from '@/lib/navigation';

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
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  className="text-base-900 text-lg font-medium py-1 border-b border-base-100 last:border-b-0"
                  href={link.href}
                >
                  {link.text}
                </Link>
              ))}
              <div className="flex flex-col gap-2 pt-4">
                <RequestAnimationModal buttonClassName="flex justify-center text-center font-medium items-center duration-500 ease-in-out transition-colors focus:outline-2 focus:outline-inset focus:outline-base-300 text-base-900 bg-base-50 hover:bg-base-100 h-9 px-4 py-3 text-sm rounded-lg w-full" />
                <Button isLink href="/pricing/" variant="default" size="sm">
                  Support Us
                </Button>
              </div>
            </div>
          </Wrapper>
        </div>
      )}
    </nav>
  );
}
