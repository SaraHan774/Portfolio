import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { queryKeys, CategoryRepository, fetchSiteSettings } from '@/src/data';
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

// [ISR] force-dynamic 제거 → 셸이 엣지에서 캐시 서빙되어 한국 사용자의 미국 함수 왕복 제거.
// 카테고리/사이트설정은 빌드·재검증 시 읽어 캐시하고, 변경 시 on-demand revalidation으로 즉시 반영.
// (작품 목록/상세는 CSR이라 셸 캐시와 무관하게 항상 최신)
export const revalidate = 300;

/** 서버 사전 페칭 상한(ms). 초과 시 부분 결과로 진행하고 클라이언트가 나머지를 페칭. */
const SSR_PREFETCH_TIMEOUT_MS = 2000;

/**
 * 레이아웃에 항상 필요한 전역 데이터(카테고리 네비)를 서버에서 미리 읽어 dehydrate한다.
 * 카테고리 네비는 layout에서 렌더되므로 여기서 하이드레이션해야 초기 HTML에 담겨
 * JS+Firestore 왕복 없이 즉시 표시된다(CSR waterfall 단축).
 * searchParams와 무관한 전역 데이터라 클라이언트 탐색 시 서버 왕복을 유발하지 않는다.
 * 서버 페칭이 지연/실패해도 SSR을 막지 않도록 타임아웃을 두고, 미완료분은 클라이언트가 페칭.
 * (작품 목록은 카테고리별/searchParams 의존이라 layout이 아닌 page에서 별도 처리.)
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

// 메타데이터를 서버에서 동적으로 생성한다.
// 검색 엔진은 SSR된 HTML <head>의 description을 읽으므로, admin에서 수정한 소개 글
// (browserDescription)이 검색 결과 스니펫에 반영되려면 여기(서버)에서 출력해야 한다.
// force-dynamic이라 매 요청 최신값을 읽고, 조회 실패 시 기본값으로 폴백한다(graceful).
// (title/favicon은 변경 범위 밖이라 기존 하드코딩 유지)
export async function generateMetadata(): Promise<Metadata> {
  const settings = await fetchSiteSettings();
  return {
    title: "hyebinna",
    description: settings.browserDescription,
    icons: {
      icon: '/favicon.ico',
    },
  };
}

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
