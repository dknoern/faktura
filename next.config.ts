import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Temporarily disable optimization to fix production issues
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Ensure static files are properly served
  trailingSlash: false,
  output: 'standalone',
};

export default nextConfig;
