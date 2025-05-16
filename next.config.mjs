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
