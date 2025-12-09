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
    // Fix for clientReferenceManifest issue in Next.js 15
    serverComponentsExternalPackages: [],
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
    
    // Fix for clientReferenceManifest in production builds
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'utf-8-validate': 'commonjs utf-8-validate',
        'bufferutil': 'commonjs bufferutil',
      });
    }
    
    return config;
  },
};

export default nextConfig;
