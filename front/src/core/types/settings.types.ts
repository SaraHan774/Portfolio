// Site settings types

export interface SiteSettings {
  id: string;
  browserTitle: string;        // 브라우저 탭 제목
  browserDescription: string;  // 메타 설명
  faviconUrl?: string;         // 파비콘 URL
  footerText: string;          // Footer에 표시할 텍스트
  updatedAt: Date;
}
