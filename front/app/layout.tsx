import type { Metadata } from "next";
import { Nanum_Myeongjo } from "next/font/google";
import "./globals.css";
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

const nanumMyeongjo = Nanum_Myeongjo({
  weight: ['400', '700'],
  subsets: ["latin"],
  display: "swap",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
          </QueryProvider>
          </ToastProvider>
        </ErrorBoundary>
        <DebugGrid />
        <ColorPaletteDebugger />
      </body>
    </html>
  );
}
