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
      '@vercel/functions': './lib/vercel-functions-shim.js',
    };
    return config;
  },
  turbopack: {
    resolveAlias: {
      '@vercel/functions': './lib/vercel-functions-shim.js',
    },
  },
};

export default nextConfig;
