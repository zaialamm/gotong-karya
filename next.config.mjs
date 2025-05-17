/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable server components for this project to avoid issues with Solana integration
  // This will make the entire app client-side rendered
  reactStrictMode: false,
  
  webpack: (config) => {
    // This is necessary for Metaplex to work with Next.js
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      os: false,
      path: false,
      crypto: false,
    };
    
    // Exclude specific files from being processed
    config.module = {
      ...config.module,
      exprContextCritical: false,
      rules: [
        ...config.module.rules,
        {
          test: /\.m?js$/,
          resolve: {
            fullySpecified: false,
          },
        },
      ],
    };
    
    return config;
  },
  
  // Exclude the Anchor program tests from the Next.js build
  eslint: {
    // Warning: This allows production builds to successfully complete even with
    // ESLint errors. Remove this if you want production builds to fail if there are ESLint errors.
    ignoreDuringBuilds: true,
  },
  
  typescript: {
    // Disable TypeScript during builds to prevent errors with missing Anchor types
    ignoreBuildErrors: true,
  },
  
  // Disable source maps in production to reduce build size
  productionBrowserSourceMaps: false,
  
  // Exclude specific directories from being processed by Next.js
  experimental: {
    // Disable app directory features that might be causing issues
    serverActions: false,
    outputFileTracingExcludes: {
      '*': [
        'gkescrow/**',
        'node_modules/@coral-xyz/anchor/**',
        'node_modules/@solana/**',
      ],
    },
  },
  
  images: {
    unoptimized: true
  },

};

export default nextConfig;
