'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

import { MaxWidthContainer } from './max-width-container';
import { ThemeToggle } from './theme-toggle';
import { Heading } from './heading';
import { cn } from '@/lib/utils';
import { useIsScrolled } from '@/lib/use-is-scrolled';
import { MobileMenu } from './mobile-menu';
import { navigationLinks } from '@/config/links';

export function Header() {
  const isScrolled = useIsScrolled();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header
      className={cn(
        'sticky top-0 z-60 w-full border-b bg-background transition-colors duration-150 ease-out',
        isScrolled ? 'border-black dark:border-border' : 'border-transparent',
      )}
    >
      <MaxWidthContainer className="flex h-20 items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-x-3">
          <Avatar isMobileMenuOpen={isMobileMenuOpen} />
          <Heading variant="body">Angela Iskra</Heading>
        </Link>

        <div className="flex items-center gap-1 sm:hidden">
          <ThemeToggle className={cn('relative z-50 h-11 w-11', isMobileMenuOpen && 'invisible')} />
          <MobileMenu isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} />
        </div>

        <nav className="hidden items-center gap-x-10 sm:flex">
          {navigationLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="-mx-3 inline-flex h-9 items-center rounded-md px-3 text-muted-fg transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current dark:text-foreground dark:hover:bg-muted-hover dark:hover:text-[#F5F0E6]"
            >
              <Heading className="text-base text-inherit">{link.label}</Heading>
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
        'relative z-60 rounded-full transition-[filter] duration-500 ease-[cubic-bezier(0.77,0,0.175,1)]',
        isMobileMenuOpen ? 'contrast-125 grayscale' : 'contrast-100 grayscale-0 delay-0',
      )}
    />
  );
}
