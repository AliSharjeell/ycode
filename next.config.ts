import type { NextConfig } from 'next';
import * as path from 'node:path';

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      // @vercel/functions was uninstalled; alias to a local no-op shim.
      '@vercel/functions': path.resolve(__dirname, 'lib/vercel-functions-shim.ts'),
    };
    return config;
  },
  turbopack: {
    resolveAlias: {
      '@vercel/functions': path.resolve(__dirname, 'lib/vercel-functions-shim.ts'),
    },
  },
};

export default nextConfig;
