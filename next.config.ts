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
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    // Fix for clientModules bundling issues in Next.js 15
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  // Add webpack configuration to handle module resolution
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

export default nextConfig;
