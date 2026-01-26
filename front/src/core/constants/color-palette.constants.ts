/**
 * 디자인 시스템 색상 팔레트 정의
 *
 * globals.css의 CSS 변수와 동기화되어야 합니다.
 */

export interface ColorVariable {
  /** CSS 변수명 (--color-black 형태) */
  cssVar: string;
  /** 설명 */
  label: string;
  /** 기본값 (hex 색상 코드) */
  defaultValue: string;
  /** 카테고리 */
  category: 'base' | 'text' | 'layout' | 'category' | 'other';
  /** 사용처 설명 */
  usage?: string;
}

/**
 * 색상 팔레트 정의
 */
export const COLOR_PALETTE: ColorVariable[] = [
  // 기본 색상
  {
    cssVar: '--color-black',
    label: 'Black',
    defaultValue: '#0C0C0C',
    category: 'base',
    usage: '기본 검정색 (텍스트, 카테고리, 점 표시 등)',
  },
  {
    cssVar: '--color-white',
    label: 'White',
    defaultValue: '#FFFFFF',
    category: 'base',
    usage: '배경색, 흰색 텍스트',
  },
  {
    cssVar: '--color-gray-100',
    label: 'Gray 100',
    defaultValue: '#F5F5F5',
    category: 'base',
    usage: '매우 밝은 회색 (호버 배경)',
  },
  {
    cssVar: '--color-gray-200',
    label: 'Gray 200',
    defaultValue: '#E5E5E5',
    category: 'base',
    usage: '밝은 회색 (테두리)',
  },
  {
    cssVar: '--color-gray-300',
    label: 'Gray 300',
    defaultValue: '#D4D4D4',
    category: 'base',
    usage: '중간 밝은 회색 (스크롤바 점선)',
  },
  {
    cssVar: '--color-gray-400',
    label: 'Gray 400',
    defaultValue: '#A9A9A9',
    category: 'base',
    usage: '중간 회색',
  },
  {
    cssVar: '--color-gray-500',
    label: 'Gray 500',
    defaultValue: '#737373',
    category: 'base',
    usage: '중간 어두운 회색',
  },
  {
    cssVar: '--color-gray-600',
    label: 'Gray 600',
    defaultValue: '#A9A9A9',
    category: 'base',
    usage: '중간 회색 (스크롤바, 보조 텍스트)',
  },
  {
    cssVar: '--color-gray-700',
    label: 'Gray 700',
    defaultValue: '#787878',
    category: 'base',
    usage: '어두운 회색',
  },
  {
    cssVar: '--color-gray-800',
    label: 'Gray 800',
    defaultValue: '#262626',
    category: 'base',
    usage: '매우 어두운 회색',
  },
  {
    cssVar: '--color-gray-900',
    label: 'Gray 900',
    defaultValue: '#171717',
    category: 'base',
    usage: '거의 검정색',
  },

  // 텍스트 색상
  {
    cssVar: '--color-text-primary',
    label: 'Text Primary',
    defaultValue: '#0C0C0C',
    category: 'text',
    usage: '주요 텍스트 (body, 제목 등)',
  },
  {
    cssVar: '--color-text-secondary',
    label: 'Text Secondary',
    defaultValue: '#A9A9A9',
    category: 'text',
    usage: '보조 텍스트',
  },
  {
    cssVar: '--color-text-muted',
    label: 'Text Muted',
    defaultValue: '#A9A9A9',
    category: 'text',
    usage: '흐릿한 텍스트',
  },

  // 레이아웃 색상
  {
    cssVar: '--color-background',
    label: 'Background',
    defaultValue: '#FFFFFF',
    category: 'layout',
    usage: '전체 배경색 (body)',
  },
  {
    cssVar: '--color-border',
    label: 'Border',
    defaultValue: '#E5E5E5',
    category: 'layout',
    usage: '테두리, 구분선',
  },
  {
    cssVar: '--color-hover',
    label: 'Hover',
    defaultValue: '#F5F5F5',
    category: 'layout',
    usage: '호버 상태 배경',
  },

  // 카테고리 색상
  {
    cssVar: '--color-category-basic',
    label: 'Category Basic',
    defaultValue: '#8e8c8c',
    category: 'category',
    usage: '기본 카테고리 (클릭 불가)',
  },
  {
    cssVar: '--color-category-clickable',
    label: 'Category Clickable',
    defaultValue: '#0C0C0C',
    category: 'category',
    usage: '클릭 가능한 카테고리',
  },
  {
    cssVar: '--color-category-disabled',
    label: 'Category Disabled',
    defaultValue: '#8e8c8c',
    category: 'category',
    usage: '비활성 카테고리 (현재 작품에 없음)',
  },
  {
    cssVar: '--color-category-hover-stroke',
    label: 'Category Hover Stroke',
    defaultValue: '#0C0C0C',
    category: 'category',
    usage: '카테고리 호버 시 밑줄',
  },

  // 기타
  {
    cssVar: '--dot-color',
    label: 'Dot Color',
    defaultValue: '#0C0C0C',
    category: 'other',
    usage: '카테고리 점(˙) 표시',
  },
];

/**
 * 카테고리별 레이블
 */
export const CATEGORY_LABELS: Record<ColorVariable['category'], string> = {
  base: 'Base Colors',
  text: 'Text Colors',
  layout: 'Layout Colors',
  category: 'Category Colors',
  other: 'Other Colors',
};
