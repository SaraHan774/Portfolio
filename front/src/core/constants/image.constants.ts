// 상세 화면 이미지 렌더 상수 (인라인 본문 이미지 + SSR preload 링크가 공유)

/**
 * 상세 페이지 인라인 이미지의 반응형 크기 힌트.
 * --media-width 브레이크포인트(모바일 100% / 768~1199px 60% / 데스크톱 ~50%)에 맞춰
 * next/image가 화면 폭에 맞는 변형을 선택하도록 한다(모바일 과대 전송 방지).
 *
 * 이 값은 WorkDetailPage 인라인 이미지의 `sizes`와 SSR preload 링크의
 * `imagesizes`가 반드시 동일해야 하므로 한 곳에서 export 한다.
 * (불일치 시 브라우저가 다른 변형을 선택해 이중 다운로드 낭비)
 */
export const DETAIL_IMAGE_SIZES =
  '(max-width: 767px) 100vw, (max-width: 1199px) 60vw, 50vw';

/** 인라인 본문 이미지 품질(모달 본문과 동일, 화질 보존 우선). */
export const DETAIL_IMAGE_QUALITY = 72;

/**
 * next/image deviceSizes (next.config.ts와 동일하게 유지).
 * preload srcset을 next/image 변형과 일치시키기 위해 사용한다.
 */
export const DETAIL_IMAGE_DEVICE_SIZES = [384, 640, 750, 828, 1080, 1200, 1920] as const;
