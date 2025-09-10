import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Disable optimization to fix production issues
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
  // Add explicit headers for static assets
  async headers() {
    return [
      {
        source: '/kiosk-bg.jpg',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
