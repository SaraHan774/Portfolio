// next/image 최적화 URL 빌더 (SSR preload 링크용)
//
// next/image는 런타임에 `/_next/image?url=...&w=...&q=...` 형태로 변형 이미지를
// 요청한다. preload 링크의 `imagesrcset`을 이 형식과 정확히 일치시켜야
// 브라우저가 하이드레이션 전에 받기 시작한 이미지를 next/image가 그대로 재사용한다.
// (불일치 시 이중 다운로드 낭비)

import { DETAIL_IMAGE_DEVICE_SIZES, DETAIL_IMAGE_QUALITY } from '@/core/constants';

/**
 * 단일 width에 대한 next/image 최적화 경로를 만든다.
 */
export function buildNextImageUrl(src: string, width: number, quality: number): string {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`;
}

interface BuildPreloadSrcSetOptions {
  /** next.config.ts의 qualities에 등록된 값이어야 한다(기본 72). */
  quality?: number;
  /** next.config.ts의 deviceSizes와 동일해야 한다. */
  widths?: readonly number[];
}

/**
 * preload `<link imagesrcset>`에 넣을 srcset 문자열을 만든다.
 * next/image가 생성하는 srcset과 동일한 후보 집합(각 deviceSize별 변형)을 제공한다.
 *
 * @example
 *   buildPreloadImageSrcSet('https://.../a.jpg')
 *   // "/_next/image?url=...&w=384&q=72 384w, /_next/image?url=...&w=640&q=72 640w, ..."
 */
export function buildPreloadImageSrcSet(
  src: string,
  { quality = DETAIL_IMAGE_QUALITY, widths = DETAIL_IMAGE_DEVICE_SIZES }: BuildPreloadSrcSetOptions = {}
): string {
  return widths
    .map((w) => `${buildNextImageUrl(src, w, quality)} ${w}w`)
    .join(', ');
}
