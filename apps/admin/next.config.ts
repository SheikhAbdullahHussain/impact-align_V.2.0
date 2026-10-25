import path from 'node:path';
import type { NextConfig } from 'next';
import { staticSecurityHeaders } from '@impactalign/config';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: 'standalone',
  // Monorepo: trace dependencies from the repository root so standalone builds include packages/*.
  outputFileTracingRoot: path.join(__dirname, '../../'),
  async rewrites() {
    const apiInternalUrl = (process.env.API_INTERNAL_URL ?? 'http://localhost:4000').replace(/\/$/, '');
    return [{ source: '/api/v1/:path*', destination: `${apiInternalUrl}/api/v1/:path*` }];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          ...staticSecurityHeaders.map(({ key, value }) => ({ key, value })),
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
        ],
      },
    ];
  },
};

export default nextConfig;
