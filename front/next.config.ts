import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9199',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '9199',
      },
    ],
    dangerouslyAllowSVG: true,
    // Emulator(localhost) 이미지 최적화 허용
    unoptimized: process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true',
  },
};

export default nextConfig;
