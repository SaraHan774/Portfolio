import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { queryKeys, CategoryRepository, WorkRepository } from '@/src/data';
import { ErrorBoundary, PortfolioLayoutSimple, DebugGrid, ColorPaletteDebugger } from '@/presentation';
import ImageZoomProvider from '@/presentation/components/layout/ImageZoomProvider';
import { AnalyticsProvider } from '@/presentation/components/analytics/AnalyticsProvider';
import { ToastProvider } from '@/presentation/contexts/ToastContext';
import {
  CategoriesProvider,
  CategorySelectionProvider,
  UIStateProvider,
  QueryProvider,
} from '@/state';
import React, { Suspense } from "react";
import { LoadingContainer } from '@/presentation/ui';

// 매 요청마다 서버에서 최신 데이터를 읽어 SSR(새 업로드 즉시 반영 보장).
export const dynamic = 'force-dynamic';

/** 서버 사전 페칭 상한(ms). 초과 시 부분 결과로 진행하고 클라이언트가 나머지를 페칭. */
const SSR_PREFETCH_TIMEOUT_MS = 2000;

/**
 * 레이아웃에 항상 필요한 전역 데이터(카테고리 네비 + 작품 목록)를 서버에서 미리 읽어
 * dehydrate한다. 카테고리 네비는 layout에서 렌더되므로 여기서 하이드레이션해야
 * 초기 HTML에 콘텐츠가 담겨 JS+Firestore 왕복 없이 즉시 표시된다(CSR waterfall 단축).
 * searchParams와 무관한 전역 데이터라 클라이언트 탐색 시 서버 왕복을 유발하지 않는다.
 * 서버 페칭이 지연/실패해도 SSR을 막지 않도록 타임아웃을 두고, 미완료분은 클라이언트가 페칭.
 */
async function prefetchGlobalData() {
  const queryClient = new QueryClient();
  const prefetch = Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.categories.sentence.all(),
      queryFn: () => CategoryRepository.getSentenceCategories(),
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.categories.exhibition.all(),
      queryFn: () => CategoryRepository.getExhibitionCategories(),
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.works.published(),
      queryFn: () => WorkRepository.getPublishedWorks(),
    }),
  ]);
  await Promise.race([
    prefetch,
    new Promise((resolve) => setTimeout(resolve, SSR_PREFETCH_TIMEOUT_MS)),
  ]);
  return dehydrate(queryClient);
}

// 나눔명조(OFL)를 KS X 1001 상용 한글 2,350자 + ASCII로 직접 서브셋해 self-host.
// next/font/google가 한글 unicode-range 청크 100여 개(=1.66MB)를 온디맨드로 받던 것을
// weight당 단일 woff2(합 ~0.69MB)로 대체. preload는 끄고(swap 폴백 즉시 표시) LCP 이미지에
// 대역폭을 양보한다. 2,350자에 없는 드문 글자는 시스템 세리프로 폴백.
const nanumMyeongjo = localFont({
  src: [
    { path: "./fonts/NanumMyeongjo-Regular.subset.woff2", weight: "400", style: "normal" },
    { path: "./fonts/NanumMyeongjo-Bold.subset.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
  preload: false,
  variable: "--font-nanum-myeongjo",
});

// Viewport 설정 (모바일 최적화)
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

// 기본 메타데이터 (하드코딩)
export const metadata: Metadata = {
  title: "hyebinna",
  description: "여백의 미를 살린 미니멀한 디지털 갤러리",
  icons: {
    icon: '/favicon.ico',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const dehydratedState = await prefetchGlobalData();
  return (
    <html lang="ko">
      <head>
        {/* 이미지 호스트 사전 연결: 줌 원본·YouTube 썸네일 등 외부 직접 로드의 DNS+TLS 지연 제거.
            (next/image 최적화 이미지는 same-origin이라 별도 불필요) */}
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" />
        <link rel="dns-prefetch" href="https://firebasestorage.googleapis.com" />
        <link rel="preconnect" href="https://img.youtube.com" />
        <link rel="dns-prefetch" href="https://img.youtube.com" />
      </head>
      <body
        className={`${nanumMyeongjo.variable} antialiased`}
        style={{ fontFamily: 'var(--font-nanum-myeongjo)' }}
      >
        <ErrorBoundary>
          <ToastProvider>
            <QueryProvider>
              <HydrationBoundary state={dehydratedState}>
              <AnalyticsProvider>
              <CategoriesProvider>
                <CategorySelectionProvider>
                  <UIStateProvider>
                    <ImageZoomProvider>
                      <Suspense fallback={<LoadingContainer size={24} />}>
                        <PortfolioLayoutSimple>
                          {children}
                        </PortfolioLayoutSimple>
                      </Suspense>
                    </ImageZoomProvider>
                  </UIStateProvider>
                </CategorySelectionProvider>
              </CategoriesProvider>
            </AnalyticsProvider>
              </HydrationBoundary>
          </QueryProvider>
          </ToastProvider>
        </ErrorBoundary>
        <DebugGrid />
        <ColorPaletteDebugger />
      </body>
    </html>
  );
}
