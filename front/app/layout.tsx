import type { Metadata } from "next";
import { Nanum_Myeongjo } from "next/font/google";
import "./globals.css";
import { DynamicMetadata, ErrorBoundary } from '@/presentation';
import {
  CategoriesProvider,
  CategorySelectionProvider,
  WorkSelectionProvider,
  UIStateProvider,
  QueryProvider
} from '@/state';

const nanumMyeongjo = Nanum_Myeongjo({
  weight: ['400', '700'],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-nanum-myeongjo",
});

// 기본 메타데이터 (SEO용 폴백)
export const metadata: Metadata = {
  title: "Portfolio | 작품 갤러리",
  description: "여백의 미를 살린 미니멀한 디지털 갤러리",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${nanumMyeongjo.variable} antialiased`}
        style={{ fontFamily: 'var(--font-nanum-myeongjo)' }}
      >
        <DynamicMetadata />
        <ErrorBoundary>
          <QueryProvider>
            <CategoriesProvider>
              <CategorySelectionProvider>
                <WorkSelectionProvider>
                  <UIStateProvider>
                    {children}
                  </UIStateProvider>
                </WorkSelectionProvider>
              </CategorySelectionProvider>
            </CategoriesProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
