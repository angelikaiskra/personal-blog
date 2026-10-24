import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';

interface MetadataOptions {
  path: string;
  title?: string;
  description?: string;
  article?: {
    publishedTime: string;
    modifiedTime: string;
    tags: string[];
    section?: string;
  };
}

const defaultImage = {
  url: '/og-image.png',
  width: 1732,
  height: 908,
  alt: `Orange voxel cat sitting on a sunny yellow background • ${siteConfig.name}`,
};

export function createMetadata({
  path,
  title = siteConfig.name,
  description = siteConfig.description,
  article,
}: MetadataOptions): Metadata {
  const url = new URL(path, siteConfig.url).href;

  return {
    title: title === siteConfig.name ? { absolute: title } : title,
    description,
    alternates: {
      canonical: url,
      types: { 'application/rss+xml': '/rss.xml' },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.name,
      locale: 'en_US',
      images: [defaultImage],
      ...(article
        ? {
            type: 'article',
            authors: [new URL('/about', siteConfig.url).href],
            ...article,
          }
        : { type: 'website' }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [defaultImage],
    },
  };
}
