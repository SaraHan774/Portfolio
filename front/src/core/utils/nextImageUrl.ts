// next/image 변형(optimizer) URL 생성 유틸
//
// next/image는 원본 src를 `/_next/image?url=...&w=...&q=...` 형태로 서빙한다.
// prefetch가 실제 이미지 요청과 정확히 동일한 URL을 만들도록 이 유틸을 공유한다.
// (plan② perf/ssr-preload 와도 동일 규칙으로 공유 — 머지 순서 주의)

/**
 * next/image optimizer 변형 URL을 생성한다.
 *
 * @param src - 원본 이미지 URL (절대 경로 또는 정적 경로)
 * @param w - 디바이스 폭(px). next.config의 deviceSizes 중 하나여야 캐시가 일치한다.
 * @param q - 품질(1~100). next/image 요청과 동일해야 캐시 히트가 발생한다.
 * @returns `/_next/image?url=...&w=...&q=...` 형태의 변형 URL
 */
export function buildNextImageUrl(src: string, w: number, q: number): string {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=${q}`;
}

/**
 * 여러 폭에 대한 next/image `imagesrcset` 문자열을 생성한다.
 * `<link rel="prefetch" as="image" imagesrcset=... imagesizes=...>` 와 함께 사용해
 * sizes 분기(반응형)를 유지한 채 prefetch 할 수 있다.
 *
 * @param src - 원본 이미지 URL
 * @param widths - deviceSizes 부분집합
 * @param q - 품질(1~100)
 * @returns `"url1 384w, url2 640w, ..."` 형태의 srcset 문자열
 */
export function buildNextImageSrcSet(src: string, widths: number[], q: number): string {
  return widths
    .map((w) => `${buildNextImageUrl(src, w, q)} ${w}w`)
    .join(', ');
}
