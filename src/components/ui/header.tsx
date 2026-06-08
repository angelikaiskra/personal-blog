'use client';

import Image from 'next/image';
import Link from 'next/link';

import { MaxWidthContainer } from './max-width-container';
import { ThemeToggle } from './theme-toggle';
import { Heading } from './heading';
import { cn } from '@/lib/utils';
import { useIsScrolled } from '@/lib/use-is-scrolled';

const links = [
  { href: '/', label: 'Home' },
  { href: '/blog', label: 'Blog' },
  { href: '/about', label: 'About' },
];

export function Header() {
  const isScrolled = useIsScrolled();

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b bg-white transition-colors duration-150 ease-out',
        isScrolled ? 'border-black' : 'border-transparent'
      )}
    >
      <MaxWidthContainer className="flex h-20 items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-x-3">
          <Avatar />
          <Heading variant="body">Angela Iskra</Heading>
        </Link>

        <nav className="flex items-center gap-x-10">
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

const Avatar = () => <Image src="/avatar.webp" alt="Angelika Iskra" width={48} height={48} className="rounded-full" />;
