import type { NextConfig } from 'next';
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

initOpenNextCloudflareForDev();
const nextConfig: NextConfig = {
  typedRoutes: true,
  serverExternalPackages: ['@prisma/client', '.prisma/client'],
  outputFileTracingIncludes: {
    '/*': ['./node_modules/.prisma/client/*.wasm'],
  },
};
export default nextConfig;
