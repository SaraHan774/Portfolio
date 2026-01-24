// Site settings types

export interface SiteSettings {
  id: string;
  browserTitle: string;        // 브라우저 탭 제목
  browserDescription: string;  // 메타 설명
  faviconUrl?: string;         // 파비콘 URL
  homeIconUrl?: string;        // 홈 아이콘 URL (기본 상태)
  homeIconHoverUrl?: string;   // 홈 아이콘 URL (호버 상태)
  homeIconSize?: number;       // 홈 아이콘 표시 크기 (px, 1~300, 기본값 48)
  footerText: string;          // Footer에 표시할 텍스트
  updatedAt: Date;
}
