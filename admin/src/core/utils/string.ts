// 문자열 관련 순수 유틸리티 함수

/**
 * 문자열 자르기 (말줄임)
 */
export const truncate = (str: string, maxLength: number, suffix = '...'): string => {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - suffix.length) + suffix;
};

/**
 * URL 슬러그 생성
 */
export const slugify = (str: string): string => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * 첫 글자 대문자화
 */
export const capitalize = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * HTML 태그 제거 (텍스트 추출용)
 *
 * ⚠️ WARNING: NOT SAFE for XSS prevention!
 * This is only for display purposes (e.g., character counting).
 * For sanitization, use DOMPurify instead.
 *
 * @example
 * stripHtml('<p>Hello <strong>World</strong></p>') // 'Hello World'
 */
export const stripHtml = (html: string): string => {
  return html.replace(/<[^>]*>/g, '');
};

/**
 * 텍스트 글자 수 계산 (HTML 태그 제외)
 */
export const countCharacters = (html: string): number => {
  return stripHtml(html).length;
};

/**
 * YouTube URL에서 비디오 ID 추출
 * Video ID는 정확히 11자의 영문자, 숫자, 하이픈, 언더스코어로 구성됨
 */
export const extractYouTubeVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})(?:[&?/#]|$)/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})(?:[&?/#]|$)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
};

/**
 * YouTube 임베드 URL 생성
 */
export const createYouTubeEmbedUrl = (videoId: string): string => {
  return `https://www.youtube.com/embed/${videoId}`;
};

/**
 * 간단한 고유 ID 생성 (클라이언트 사이드 전용)
 *
 * ⚠️ WARNING: Not cryptographically secure!
 * Use UUID v4 or crypto.randomUUID() for security-sensitive IDs.
 * This is suitable for: UI keys, temporary identifiers, non-sensitive ordering.
 *
 * @example
 * generateSimpleId() // 'lxyz123-abc456789'
 */
export const generateSimpleId = (): string => {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 11)}`;
};

/**
 * 빈 문자열 또는 공백만 있는지 확인
 */
export const isBlank = (str: string | null | undefined): boolean => {
  return !str || str.trim().length === 0;
};

/**
 * 공백 정규화 (연속 공백을 하나로)
 */
export const normalizeWhitespace = (str: string): string => {
  return str.replace(/\s+/g, ' ').trim();
};
