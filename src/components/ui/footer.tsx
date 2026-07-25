import Link from 'next/link';

import { HeartIcon } from '@/components/icons/heart-icon';
import { footerLinkColumns, socialLinks } from '@/config/links';
import { MaxWidthContainer } from './max-width-container';
import { Text } from './text';

export function Footer() {
  const footerLinksContent = footerLinkColumns.map((column) => (
    <nav key={column[0].label} className="flex gap-2.5 max-sm:flex-col max-sm:text-center sm:flex-col">
      {column.map((link) => (
        <Text
          key={link.href}
          as="a"
          href={link.href}
          variant="base"
          className="hover:text-foreground transition-colors max-sm:underline max-sm:underline-offset-2"
        >
          {link.label}
        </Text>
      ))}
    </nav>
  ));

  return (
    <footer className="border-inset text-muted-fg border-t border-black bg-surface py-6 max-sm:border-b sm:py-10">
      <MaxWidthContainer className="flex max-sm:flex-col max-sm:items-center max-sm:gap-y-8 sm:flex-wrap sm:justify-between">
        <section className="max-sm:flex max-sm:justify-center max-sm:gap-x-8 sm:hidden">{footerLinksContent}</section>

        <section className="flex items-center gap-x-5 sm:order-3 sm:gap-x-4">
          {socialLinks.map((link) => {
            const Icon = link.icon;

            return (
              <Link
                key={link.label}
                href={link.href}
                target={link.external ? '_blank' : undefined}
                rel={link.external ? 'noopener noreferrer' : undefined}
                aria-label={link.label}
                className="text-muted-fg hover:text-foreground transition-colors"
              >
                <Icon className="size-8 sm:size-7" />
              </Link>
            );
          })}
        </section>

        <section className="sm:order-1 sm:flex sm:gap-x-25">
          <div className="space-y-2.5">
            <Text as="p" variant="base">
              © {new Date().getFullYear()} Angelika Iskra
            </Text>
            <Text as="p" variant="base" className="flex items-center gap-1.5">
              Made with <HeartIcon className="text-foreground size-4" /> in Poland
            </Text>
          </div>

          <div className="hidden gap-x-25 sm:flex">{footerLinksContent}</div>
        </section>
      </MaxWidthContainer>
    </footer>
  );
}
