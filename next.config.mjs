import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Import bundle analyzer conditionally
const withBundleAnalyzer = process.env.ANALYZE === 'true'
  ? require('@next/bundle-analyzer')({
      enabled: true,
    })
  : (config) => config;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['pbs.twimg.com', 'abs.twimg.com', 'twitter.com'],
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    optimizeCss: true,
    // Only include used 'next' features
    optimizePackageImports: ['lucide-react'],
  },
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // Enable runtime config for environment variables
  publicRuntimeConfig: {
    APP_ENV: process.env.APP_ENV || 'development',
  },
};

export default withBundleAnalyzer(nextConfig);
