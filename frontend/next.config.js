/** @type {import('next').NextConfig} */
const apiOrigin =
  process.env.API_INTERNAL_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'http://backend:3001'
    : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001');

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiOrigin}/api/v1/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
