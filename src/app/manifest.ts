import type { MetadataRoute } from 'next';

import { siteConfig } from '@/config/site';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: siteConfig.name,
    description: siteConfig.description,
    start_url: '/',
    display: 'browser',
    icons: [
      { src: '/favicon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/favicon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/favicon-mask.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
