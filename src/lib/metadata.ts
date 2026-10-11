import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';

interface MetadataOptions {
  title: string;
  description: string;
  path: string;
  article?: {
    publishedTime: string;
    modifiedTime: string;
    tags: string[];
    section?: string;
  };
}

export function createMetadata({ title, description, path, article }: MetadataOptions): Metadata {
  const socialTitle = title === siteConfig.name ? title : `${title} | ${siteConfig.name}`;
  const url = new URL(path, siteConfig.url).href;

  return {
    title: title === siteConfig.name ? { absolute: title } : title,
    description,
    alternates: {
      canonical: url,
      types: { 'application/rss+xml': '/rss.xml' },
    },
    openGraph: {
      title: socialTitle,
      description,
      url,
      siteName: siteConfig.name,
      // TODO: Add a shared images array with an image URL, width, height, and alt text.
      ...(article
        ? {
            type: 'article',
            authors: [new URL('/about', siteConfig.url).href],
            ...article,
          }
        : { type: 'website' }),
    },
    twitter: {
      card: 'summary',
      title: socialTitle,
      description,
      // TODO: Add images with an image URL and alt text; switch the card to summary_large_image.
    },
  };
}
