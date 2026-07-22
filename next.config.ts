import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
  // The desktop app does not need @vercel/functions, serverExternalPackages,
  // or any of the database driver stubs.
};

export default nextConfig;
