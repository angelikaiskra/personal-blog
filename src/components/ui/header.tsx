import Link from 'next/link';
import { ThemeToggle } from './theme-toggle';
import Image from 'next/image';
import { Text } from './text';
import { MaxWidthContainer } from './max-width-container';
import { Heading } from "./heading";

const links = [
  { href: '/', label: 'Home' },
  { href: '/blog', label: 'Blog' },
  { href: '/about', label: 'About' },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full">
      <MaxWidthContainer className="flex h-20 items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-x-3">
          <Avatar />
          <Heading variant="body">Angela Iskra</Heading>
        </Link>

        <nav className="flex items-center gap-x-10">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              <Heading color="muted" className="hover:text-foreground text-base transition-colors">
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
