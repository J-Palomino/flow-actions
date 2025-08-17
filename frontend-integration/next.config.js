/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Optimize build performance
  experimental: {
    optimizeCss: false, // Disable CSS optimization that can cause hangs
  },
  // Build optimization
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production', // Remove console logs in production
  },
  // Enable webpack 5 features
  webpack: (config, { isServer }) => {
    // Fix for FCL and Flow SDK
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    
    // Optimize build performance
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        maxSize: 240000, // Limit chunk size to prevent memory issues
      },
    };
    
    return config;
  },
}

module.exports = nextConfig