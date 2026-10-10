import path from 'node:path';
import type { NextConfig } from 'next';
import { staticSecurityHeaders } from '@impactalign/config';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: 'standalone',
  // Monorepo: trace dependencies from the repository root so standalone builds include packages/*.
  outputFileTracingRoot: path.join(__dirname, '../../'),
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
