import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/meus-eventos', destination: '/meus-convites', permanent: true },
      { source: '/', destination: 'https://vaikeuvou.app', permanent: true },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lntgfqbuqfiukgnhdvxe.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
