import type { NextConfig } from "next";

const baseUrl = process.env.NEXT_PUBLIC_API_ASSETS_URL;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: [`http://${baseUrl}:80`, `http://${baseUrl}:3000`, "http://apibackend:8001", "http://localhost"],
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'apibackend',
        port: '8001',
        pathname: '/media/**',
      },
      {
        protocol: 'http',
        hostname: `${baseUrl}`,
        pathname: '/media/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        pathname: '/media/**',
      },
    ],
  },
};

export default nextConfig;
