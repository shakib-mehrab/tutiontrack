import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The parent folder has a stray package-lock.json; pin the app root.
  turbopack: { root: process.cwd() },

  // Performance optimizations
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },

  // Compression and optimization
  compress: true,
  poweredByHeader: false,
  
  // Old URLs (pre-redesign) keep working for bookmarks and installed shortcuts.
  async redirects() {
    return [
      { source: '/dashboard/teacher', destination: '/dashboard', permanent: true },
      { source: '/dashboard/student', destination: '/dashboard', permanent: true },
      { source: '/tuition/:id', destination: '/tuitions/:id', permanent: true },
    ];
  },

  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
