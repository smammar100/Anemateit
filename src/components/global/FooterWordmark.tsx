'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Logo from '@/components/assets/Logo';

gsap.registerPlugin(ScrollTrigger);

/**
 * Decorative footer wordmark that slides horizontally as the user reaches
 * the bottom of the page. Mirrors the GSAP ScrollTrigger pattern from the
 * Onward reference: scrub the wordmark from translateX(-15%) -> translateX(0%)
 * across the scroll range where the footer is moving through the viewport's
 * bottom edge.
 *
 * The ScrollTrigger is bound to the parent <footer> (not the wordmark wrapper)
 * because the wrapper has `-mb-24` and extends below the document, so its own
 * "bottom bottom" anchor is unreachable. The footer's bottom == document bottom,
 * so `end: 'bottom bottom'` lands exactly at max scroll.
 */
export default function FooterWordmark() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const footer = ref.current.closest('footer');
    if (!footer) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ref.current,
        { x: '-15%' },
        {
          x: '0%',
          ease: 'none',
          scrollTrigger: {
            trigger: footer,
            start: 'top bottom',
            end: 'bottom bottom',
            scrub: true,
          },
        },
      );
    });

    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} className="mt-8 -mb-24 w-full will-change-transform">
      <Logo className="text-base-100 w-full block" />
    </div>
  );
}
