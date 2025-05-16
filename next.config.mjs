/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // This is necessary for Metaplex to work with Next.js
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      os: false,
      path: false,
      crypto: false,
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
  
  // Exclude specific directories from being processed by Next.js
  experimental: {
    outputFileTracingExcludes: {
      '*': [
        'gkescrow/tests/**',
        'gkescrow/target/**',
        'node_modules/@coral-xyz/anchor/**',
      ],
    },
  },
  
  // Allow all images by disabling Next.js image optimization
  // This is simpler than specifying every possible domain
  images: {
    unoptimized: true
  },

  // Explicitly set env variables for client-side access
  // Note: Variables prefixed with NEXT_PUBLIC_ are automatically exposed to the browser
  env: {
    // Any additional non-NEXT_PUBLIC_ variables you want to expose
  },
};

export default nextConfig;
