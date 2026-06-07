import Link from 'next/link';

import { GithubIcon } from '@/components/icons/github-icon';
import { HeartIcon } from '@/components/icons/heart-icon';
import { LinkedinIcon } from '@/components/icons/linkedin-icon';
import { RssIcon } from '@/components/icons/rss-icon';
import { EnvelopeIcon } from "@/components/icons/envelope-icon";
import { MaxWidthContainer } from "./max-width-container";
import { Text } from "./text";

const footerLinks = [
  [
    { href: '/blog', label: 'Blog' },
    { href: '/about', label: 'About' },
  ],
  [
    { href: '/sitemap.xml', label: 'Sitemap' },
    { href: '/privacy-policy', label: 'Privacy Policy' },
  ],
];

const socialLinks = [
  {
    href: 'https://github.com/angela-iskra',
    label: 'GitHub',
    icon: GithubIcon,
    external: true,
  },
  {
    href: 'https://www.linkedin.com',
    label: 'LinkedIn',
    icon: LinkedinIcon,
    external: true,
  },
  {
    href: 'mailto:hello@angelaiskra.com',
    label: 'Email',
    icon: EnvelopeIcon,
  },
  {
    href: '/feed.xml',
    label: 'RSS',
    icon: RssIcon,
  },
];

export function Footer() {
  return (
    <footer className="border-border border-t py-10">
      <MaxWidthContainer className="flex justify-between">
        <div className="text-muted-fg flex gap-x-25">
          <section className="space-y-2">
            <Text as="p" variant="small">© {new Date().getFullYear()} Angelika Iskra</Text>
            <Text as="p" variant="small" className="flex items-center gap-1.5">
              Made with <HeartIcon className="size-4 text-[#FF4D5A]" /> in Szczecin, Poland
            </Text>
          </section>

          {footerLinks.map((column) => (
            <nav key={column[0].label} className="flex flex-col gap-3">
              {column.map((link) => (
                <Text key={link.href} as="a" href={link.href} variant="small" className="hover:text-foreground transition-colors">
                  {link.label}
                </Text>
              ))}
            </nav>
          ))}
        </div>

        <div className="flex items-center gap-x-5">
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
                <Icon />
              </Link>
            );
          })}
        </div>
      </MaxWidthContainer>
    </footer>
  );
}
