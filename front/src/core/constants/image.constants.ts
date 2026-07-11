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
 * next/image deviceSizes / imageSizes (next.config.ts와 동일하게 유지).
 * preload srcset을 next/image 변형과 일치시키기 위해 사용한다.
 */
export const DETAIL_IMAGE_DEVICE_SIZES = [384, 640, 750, 828, 1080, 1200, 1920] as const;
export const DETAIL_IMAGE_IMAGE_SIZES = [48, 80, 96, 160, 256, 300] as const;

/**
 * SSR preload 링크의 imagesrcset에 넣을 후보 폭.
 *
 * next/image는 `sizes`가 지정되면 srcset 후보를 deviceSizes만이 아니라
 * (deviceSizes ∪ imageSizes) 중 `deviceSizes[0] * (최소 vw%)` 이상인 폭 전체로
 * emit한다. DETAIL_IMAGE_SIZES의 최소 vw는 50% → 임계값 384*0.5=192 → 후보에
 * imageSizes의 256·300도 포함된다.
 *
 * preload가 deviceSizes만 emit하면 브라우저가 실제 렌더에서 256/300을 선택할 때
 * next/image엔 없는 폭을 preload한 셈이 되어 이중 다운로드가 발생한다. 그래서
 * next/image의 후보 산출 로직을 동일하게 재현해 일치시킨다.
 */
const DETAIL_IMAGE_MIN_VW_RATIO =
  Math.min(
    ...[...DETAIL_IMAGE_SIZES.matchAll(/(\d+)vw/g)].map((m) => Number(m[1]))
  ) * 0.01;

export const DETAIL_IMAGE_PRELOAD_WIDTHS: readonly number[] = [
  ...DETAIL_IMAGE_IMAGE_SIZES,
  ...DETAIL_IMAGE_DEVICE_SIZES,
]
  .filter((w) => w >= DETAIL_IMAGE_DEVICE_SIZES[0] * DETAIL_IMAGE_MIN_VW_RATIO)
  .sort((a, b) => a - b);
