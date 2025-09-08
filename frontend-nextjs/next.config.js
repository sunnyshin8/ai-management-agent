/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api-v1/:path*',
  destination: `${process.env.BACKEND_URL}/api/:path*`,
      },
    ];
  }
};

module.exports = nextConfig;
