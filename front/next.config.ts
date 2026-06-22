import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // AVIF 우선, 미지원 시 WebP fallback (WebP 대비 추가 ~20-30% 절감)
    formats: ['image/avif', 'image/webp'],
    // 원본은 최대 1920px이므로 그 이상 변형은 생성하지 않음. 모바일용 소형 변형 추가
    deviceSizes: [384, 640, 750, 828, 1080, 1200, 1920],
    // 썸네일/아이콘 등 소형 이미지용 (FloatingWorkWindow 80px, 목록 썸네일 등)
    imageSizes: [48, 80, 96, 160, 256, 300],
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
