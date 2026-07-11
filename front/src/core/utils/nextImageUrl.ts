// next/image 최적화 URL 빌더 (SSR preload 링크용)
//
// next/image는 런타임에 `/_next/image?url=...&w=...&q=...` 형태로 변형 이미지를
// 요청한다. preload 링크의 `imagesrcset`을 이 형식과 정확히 일치시켜야
// 브라우저가 하이드레이션 전에 받기 시작한 이미지를 next/image가 그대로 재사용한다.
// (불일치 시 이중 다운로드 낭비)

import { DETAIL_IMAGE_PRELOAD_WIDTHS, DETAIL_IMAGE_QUALITY } from '@/core/constants';

/**
 * 단일 width에 대한 next/image 최적화 경로를 만든다.
 */
export function buildNextImageUrl(src: string, width: number, quality: number): string {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`;
}

interface BuildPreloadSrcSetOptions {
  /** next.config.ts의 qualities에 등록된 값이어야 한다(기본 72). */
  quality?: number;
  /** next/image가 실제 emit하는 후보 폭 집합과 동일해야 한다(기본 DETAIL_IMAGE_PRELOAD_WIDTHS). */
  widths?: readonly number[];
}

/**
 * preload `<link imagesrcset>`에 넣을 srcset 문자열을 만든다.
 * next/image가 `sizes` 지정 시 생성하는 srcset과 동일한 후보 집합
 * (deviceSizes ∪ imageSizes 중 임계값 이상)을 제공해 이중 다운로드를 방지한다.
 *
 * @example
 *   buildPreloadImageSrcSet('https://.../a.jpg')
 *   // "/_next/image?url=...&w=256&q=72 256w, /_next/image?url=...&w=300&q=72 300w, ..."
 */
export function buildPreloadImageSrcSet(
  src: string,
  { quality = DETAIL_IMAGE_QUALITY, widths = DETAIL_IMAGE_PRELOAD_WIDTHS }: BuildPreloadSrcSetOptions = {}
): string {
  return widths
    .map((w) => `${buildNextImageUrl(src, w, quality)} ${w}w`)
    .join(', ');
}
