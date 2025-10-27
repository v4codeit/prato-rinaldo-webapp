import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Turbopack è il bundler di default in Next.js 16

  // Enable type-safe routing (stable in Next.js 15.5+)
  typedRoutes: true,

  // Enable Cache Components for Partial Prerendering (PPR)
  cacheComponents: true,

  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
      allowedOrigins: ['localhost:3000'],
    },
  },

  // Output standalone per Docker
  output: 'standalone',

  // Image optimization per Supabase Storage
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
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
