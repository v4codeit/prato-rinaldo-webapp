import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Turbopack è il bundler di default in Next.js 16

  // Enable type-safe routing (stable in Next.js 15.5+)
  typedRoutes: true,

  // Enable Cache Components for Partial Prerendering (PPR)
  cacheComponents: true,

  experimental: {
    viewTransition: true,
    serverActions: {
      bodySizeLimit: '10mb',
      allowedOrigins: ['localhost:3000'],
    },
  },

  // Output standalone per Docker
  output: 'standalone',

  // Image optimization per Supabase Storage e OAuth providers
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      // Google OAuth avatars
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/a/**',
      },
      // GitHub avatars (future)
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '/**',
      },
    ],
  },

  // Headers di sicurezza
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      // Service Worker e version.json: mai cachare (deve sempre essere fresco)
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
        ],
      },
      {
        source: '/version.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },

  // Redirects per cambio terminologia
  async redirects() {
    return [
      {
        source: '/comunita',
        destination: '/community',
        permanent: true,
      },
      {
        source: '/comunita/:path*',
        destination: '/community/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
