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
  // Moved from experimental.serverComponentsExternalPackages
  serverExternalPackages: [],
  // Temporarily enable detailed React errors in production for debugging
  productionBrowserSourceMaps: true,
  compiler: {
    removeConsole: false,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
      // Ensure server actions are properly handled
      allowedOrigins: ['localhost:3000', '127.0.0.1:3000'],
    },
    // Fix for clientModules bundling issues in Next.js 15
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    // Disable problematic features that can cause server action issues
    ppr: false,
    cacheComponents: false,
  },
  // Simplified webpack configuration to avoid server action conflicts
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
