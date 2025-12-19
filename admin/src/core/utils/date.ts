// 날짜 관련 순수 유틸리티 함수

/**
 * 날짜 포맷팅 (한국어)
 */
export const formatDate = (
  date: Date | string | number,
  format: 'short' | 'long' | 'full' = 'short'
): string => {
  const d = new Date(date);

  if (isNaN(d.getTime())) {
    return '';
  }

  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();

  switch (format) {
    case 'short':
      return `${year}.${month.toString().padStart(2, '0')}.${day.toString().padStart(2, '0')}`;
    case 'long':
      return `${year}년 ${month}월 ${day}일`;
    case 'full': {
      const hours = d.getHours();
      const minutes = d.getMinutes();
      return `${year}년 ${month}월 ${day}일 ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    default:
      return `${year}.${month.toString().padStart(2, '0')}.${day.toString().padStart(2, '0')}`;
  }
};

/**
 * 상대 시간 표시 (예: "3일 전")
 */
export const formatRelativeTime = (date: Date | string | number): string => {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffMonth / 12);

  if (diffYear > 0) return `${diffYear}년 전`;
  if (diffMonth > 0) return `${diffMonth}개월 전`;
  if (diffDay > 0) return `${diffDay}일 전`;
  if (diffHour > 0) return `${diffHour}시간 전`;
  if (diffMin > 0) return `${diffMin}분 전`;
  return '방금 전';
};

/**
 * 날짜가 오늘인지 확인
 */
export const isToday = (date: Date | string | number): boolean => {
  const d = new Date(date);
  const today = new Date();
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
};

/**
 * 날짜 범위 내에 있는지 확인
 */
export const isWithinRange = (
  date: Date | string | number,
  start: Date | string | number,
  end: Date | string | number
): boolean => {
  const d = new Date(date).getTime();
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return d >= s && d <= e;
};

/**
 * 날짜 비교 (정렬용)
 */
export const compareDates = (
  a: Date | string | number,
  b: Date | string | number,
  direction: 'asc' | 'desc' = 'desc'
): number => {
  const dateA = new Date(a).getTime();
  const dateB = new Date(b).getTime();
  return direction === 'asc' ? dateA - dateB : dateB - dateA;
};

/**
 * 연도만 추출
 */
export const getYear = (date: Date | string | number): number => {
  return new Date(date).getFullYear();
};

/**
 * 날짜 유효성 검사
 */
export const isValidDate = (date: unknown): date is Date => {
  return date instanceof Date && !isNaN(date.getTime());
};
