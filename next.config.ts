import type { NextConfig } from 'next';
import path from 'path';
import { withContentCollections } from '@content-collections/next';

const nextConfig: NextConfig = {
  output: 'standalone',
  reactCompiler: true,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
  turbopack: {
    resolveAlias: {
      'content-collections': './.content-collections/generated/index.js',
    },
  },
  webpack: (config) => {
    config.resolve.alias['content-collections'] = path.join(process.cwd(), '.content-collections/generated/index.js');
    return config;
  },
};

export default withContentCollections(nextConfig);
