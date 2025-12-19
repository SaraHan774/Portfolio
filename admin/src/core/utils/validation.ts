// 유효성 검사 순수 유틸리티 함수

/**
 * 이메일 유효성 검사
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * URL 유효성 검사
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * YouTube URL 유효성 검사
 */
export const isValidYouTubeUrl = (url: string): boolean => {
  const patterns = [
    /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
    /^https?:\/\/youtu\.be\/[\w-]+/,
    /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]+/,
  ];

  return patterns.some((pattern) => pattern.test(url));
};

/**
 * 필수값 검사
 */
export const isRequired = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
};

/**
 * 최소 길이 검사
 */
export const hasMinLength = (value: string, minLength: number): boolean => {
  return value.length >= minLength;
};

/**
 * 최대 길이 검사
 */
export const hasMaxLength = (value: string, maxLength: number): boolean => {
  return value.length <= maxLength;
};

/**
 * 길이 범위 검사
 */
export const hasLengthInRange = (
  value: string,
  minLength: number,
  maxLength: number
): boolean => {
  return value.length >= minLength && value.length <= maxLength;
};

/**
 * 숫자 범위 검사
 */
export const isInRange = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max;
};

/**
 * 양수 검사
 */
export const isPositive = (value: number): boolean => {
  return value > 0;
};

/**
 * 정수 검사
 */
export const isInteger = (value: number): boolean => {
  return Number.isInteger(value);
};

/**
 * 연도 유효성 검사 (합리적인 범위)
 */
export const isValidYear = (year: number): boolean => {
  const currentYear = new Date().getFullYear();
  return isInteger(year) && year >= 1900 && year <= currentYear + 10;
};

/**
 * 배열 중복 여부 검사
 */
export const hasDuplicates = <T>(arr: T[]): boolean => {
  return new Set(arr).size !== arr.length;
};

/**
 * 객체 필수 키 검사
 */
export const hasRequiredKeys = <T extends object>(
  obj: T,
  requiredKeys: (keyof T)[]
): boolean => {
  return requiredKeys.every((key) => isRequired(obj[key]));
};
