import type { NextConfig } from "next";

const baseUrl = process.env.NEXT_PUBLIC_API_ASSETS_URL;
const s3Url = process.env.AWS_S3_ENDPOINT_URL;
const s3BacketName = process.env.AWS_STORAGE_BUCKET_NAME;
const publicDomain = process.env.AWS_PUBLIC_DOMAIN;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  allowedDevOrigins: [`http://${baseUrl}:80`, `http://${baseUrl}:3000`, "http://apibackend:8001", "http://localhost", `https://${s3BacketName}.${s3Url}`],
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'apibackend',
        port: '8000',
        pathname: '/media/**',
      },
      {
        protocol: 'https',
        hostname: `${s3BacketName}.${s3Url}`,
        port: '443',
        pathname: '/media/**',
      },
      {
        protocol: 'https',
        hostname: `${s3BacketName}.${s3Url}`,
        pathname: '/media/**',
      },
      {
        protocol: 'http',
        hostname: `${baseUrl}`,
        pathname: '/media/**',
      },
      {
        protocol: 'https',
        hostname: `${publicDomain}`,
        pathname: '/media/**',
      },
      {
        protocol: 'http',
        hostname: `localhost`,
        port: '8000',
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
