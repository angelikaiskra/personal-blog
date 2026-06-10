'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

import { MaxWidthContainer } from './max-width-container';
import { ThemeToggle } from './theme-toggle';
import { Heading } from './heading';
import { cn } from '@/lib/utils';
import { useIsScrolled } from '@/lib/use-is-scrolled';
import { MobileMenu } from "./mobile-menu";

const links = [
  { href: '/', label: 'Home' },
  { href: '/blog', label: 'Blog' },
  { href: '/about', label: 'About' },
];

export function Header() {
  const isScrolled = useIsScrolled();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b bg-white transition-colors duration-150 ease-out',
        isScrolled ? 'border-black' : 'border-transparent'
      )}
    >
      <MaxWidthContainer className="flex h-20 items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-x-3">
          <Avatar isMobileMenuOpen={isMobileMenuOpen} />
          <Heading variant="body">Angela Iskra</Heading>
        </Link>

        <MobileMenu isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} />

        <nav className="items-center gap-x-10 hidden sm:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              <Heading className="text-base transition-colors">
                {link.label}
              </Heading>
            </Link>
          ))}
          <ThemeToggle />
        </nav>
      </MaxWidthContainer>
    </header>
  );
}

function Avatar({ isMobileMenuOpen }: { isMobileMenuOpen: boolean }) {
  return (
    <Image
      src="/avatar.webp"
      alt="Angelika Iskra"
      width={48}
      height={48}
      className={cn(
        'relative z-[60] rounded-full transition-[filter] duration-500 ease-[cubic-bezier(0.77,0,0.175,1)]',
        // TODO: Change the image to be pixel-styled instead of grayscale
        isMobileMenuOpen ? 'grayscale contrast-125' : 'delay-0 grayscale-0 contrast-100'
      )}
    />
  );
}
