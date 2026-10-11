import { EnvelopeIcon } from '@/components/icons/envelope-icon';
import { GithubIcon } from '@/components/icons/github-icon';
import { LinkedinIcon } from '@/components/icons/linkedin-icon';
import { RssIcon } from '@/components/icons/rss-icon';

export const navigationLinks = [
  { href: '/', label: 'Home' },
  { href: '/blog', label: 'Blog' },
  { href: '/about', label: 'About' },
] as const;

export const footerLinkColumns = [
  [
    { href: '/blog', label: 'Blog' },
    { href: '/about', label: 'About' },
  ],
  [
    { href: '/sitemap.xml', label: 'Sitemap' },
    { href: '/privacy-policy', label: 'Privacy Policy' },
  ],
] as const;

export const socialLinks = [
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
    external: false,
  },
  {
    href: '/feed.xml',
    label: 'RSS',
    icon: RssIcon,
    external: false,
  },
] as const;
