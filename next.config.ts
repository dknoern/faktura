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
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    // Fix for clientModules bundling issues in Next.js 15
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    // Fix for clientReferenceManifest issue in Next.js 15
    serverComponentsExternalPackages: [],
    // Force client reference manifest generation
    clientRouterFilter: true,
    clientRouterFilterRedirects: true,
    // Additional fixes for Next.js 15 production builds
    forceSwcTransforms: true,
    // Disable problematic features that can cause clientReferenceManifest issues
    ppr: false,
    dynamicIO: false,
  },
  // Enhanced webpack configuration for clientReferenceManifest
  webpack: (config, { isServer, dev, webpack }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    // Enhanced fix for clientReferenceManifest in production builds
    if (isServer && !dev) {
      config.externals = config.externals || [];
      config.externals.push({
        'utf-8-validate': 'commonjs utf-8-validate',
        'bufferutil': 'commonjs bufferutil',
      });
      
      // Ensure proper client reference manifest generation
      config.optimization = config.optimization || {};
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks?.cacheGroups,
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: -10,
            chunks: 'all',
          },
        },
      };

      // Add plugin to ensure client reference manifest is available
      config.plugins = config.plugins || [];
      config.plugins.push(
        new webpack.DefinePlugin({
          'process.env.__NEXT_CLIENT_REFERENCE_MANIFEST': JSON.stringify(true),
        })
      );
    }
    
    return config;
  },
};

export default nextConfig;
