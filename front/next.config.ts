import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // AVIF 우선, 미지원 시 WebP fallback (WebP 대비 추가 ~20-30% 절감)
    formats: ['image/avif', 'image/webp'],
    // 옵티마이저 변환 결과를 엣지에 31일 보관 → 콜드 미스(원본 fetch + 재인코딩) 제거.
    // 새 업로드는 항상 새 UUID URL이라 캐시 키가 달라 즉시 반영됨(storageApi.ts).
    minimumCacheTTL: 2_678_400,
    // 사용 허용 품질 값 등록(Next 16). 모달 본문은 72(보수적), 그 외 기본 75 유지
    qualities: [72, 75],
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
