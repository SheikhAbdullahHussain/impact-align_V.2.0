import path from 'node:path';
import type { NextConfig } from 'next';
import { staticSecurityHeaders } from '@impactalign/config';

/** Where the Express API lives (server-side only). The browser never calls it directly. */
const apiInternalUrl = (process.env.API_INTERNAL_URL ?? 'http://localhost:4000').replace(/\/$/, '');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: 'standalone',
  // Monorepo: trace dependencies from the repository root so standalone builds include packages/*.
  outputFileTracingRoot: path.join(__dirname, '../../'),
  async rewrites() {
    // Same-origin API access: cookies stay first-party and no CORS or cross-site cookie setup is needed.
    return [{ source: '/api/v1/:path*', destination: `${apiInternalUrl}/api/v1/:path*` }];
  },
  async redirects() {
    return [
      {
        source: '/join-impactalign/accreditation',
        destination: '/accreditation',
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: staticSecurityHeaders.map(({ key, value }) => ({ key, value })),
      },
    ];
  },
};

export default nextConfig;
