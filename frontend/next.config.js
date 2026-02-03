/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
  },
  experimental: {
    optimizePackageImports: ['clsx', 'tailwind-merge'],
  },
  // Proxy /api/v1/* to the backend. Set NEXT_PUBLIC_API_URL to your backend URL (e.g. https://your-api.railway.app).
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    return [
      { source: '/api/v1/:path*', destination: `${apiUrl}/api/v1/:path*` },
    ];
  },
};

module.exports = nextConfig;
