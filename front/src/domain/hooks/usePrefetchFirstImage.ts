// 강한 인텐트(의도적 호버/탭 직전) 시점에 상세 화면 첫 이미지의 바이트를 미리 받아
// 클릭 후 브라우저 캐시 히트로 거의 즉시 표시되도록 하는 훅.
//
// 비용 제어(Firebase Storage egress) 원칙:
//  - 작품당 첫 이미지 1장만 prefetch.
//  - 동일 변형 URL 중복 발사 금지(module-level Set).
//  - saveData / 느린 네트워크(slow-2g, 2g)에서는 스킵.
//
// 호출부(WorkTitleButton, useCaptionHoverEvents)에서 인텐트 디바운스를 처리하고,
// 이 훅이 반환하는 함수를 발사한다.

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/src/data';
import { buildNextImageSrcSet, buildNextImageUrl } from '@/core/utils/nextImageUrl';
import type { Work } from '@/types';

/**
 * 상세 인라인 이미지의 반응형 크기 힌트.
 * WorkDetailPage.tsx의 DETAIL_IMAGE_SIZES와 일치해야 prefetch가 실제 요청과 같은 변형을 선택한다.
 */
const DETAIL_IMAGE_SIZES = '(max-width: 767px) 100vw, (max-width: 1199px) 60vw, 50vw';

/** 상세 인라인 이미지 품질. WorkDetailPage.tsx의 DETAIL_IMAGE_QUALITY와 일치해야 캐시가 맞는다. */
const DETAIL_IMAGE_QUALITY = 72;

/**
 * prefetch에 사용할 deviceSizes 부분집합.
 * next.config의 deviceSizes=[384,640,750,828,1080,1200,1920] 중
 * 상세 화면에서 실제로 선택될 법한 대표 폭만 추려 imagesrcset을 만든다.
 */
const PREFETCH_WIDTHS = [640, 828, 1080, 1200] as const;

/** 단일 대표 폭(imagesrcset 미지원 환경 폴백용, 모바일 100vw 기준). */
const FALLBACK_WIDTH = 1080;

/**
 * 이미 prefetch한 변형 URL 기록(중복 발사 차단).
 * module-level이므로 컴포넌트 리마운트와 무관하게 세션 동안 유지된다.
 */
const prefetchedKeys = new Set<string>();

/** 첫 이미지 url을 구한다(order 최소, 없으면 [0]). */
function getFirstImageUrl(work: Work): string | undefined {
  const images = work.images;
  if (!images || images.length === 0) return undefined;

  let first = images[0];
  for (const img of images) {
    if (img.order < first.order) {
      first = img;
    }
  }
  return first.url;
}

/** saveData 또는 느린 네트워크면 true. */
function isNetworkConstrained(): boolean {
  if (typeof navigator === 'undefined') return true;

  interface NetworkInformation {
    saveData?: boolean;
    effectiveType?: string;
  }
  const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  if (!connection) return false;

  if (connection.saveData) return true;
  const type = connection.effectiveType;
  return type === 'slow-2g' || type === '2g';
}

/**
 * 강한 인텐트 시점에 호출할 prefetch 함수를 반환한다.
 *
 * @returns `(work: Work) => void` — 작품의 첫 이미지 변형을 prefetch.
 */
export function usePrefetchFirstImage(): (work: Work) => void {
  return useCallback((work: Work) => {
    if (typeof document === 'undefined') return;

    const src = getFirstImageUrl(work);
    if (!src) return;

    // 중복 차단 키: 원본 src 기준(작품당 첫 1장 1회).
    if (prefetchedKeys.has(src)) return;

    // 네트워크 가드.
    if (isNetworkConstrained()) return;

    // 발사 전에 먼저 기록해 동시 호출 중복을 막는다.
    prefetchedKeys.add(src);

    const link = document.createElement('link');
    link.setAttribute('rel', 'prefetch');
    link.setAttribute('as', 'image');

    // imagesrcset/imagesizes 지원 시 sizes 분기를 유지한 채 prefetch.
    const supportsImageSrcSet = 'imageSrcset' in HTMLLinkElement.prototype;
    if (supportsImageSrcSet) {
      link.setAttribute('imagesrcset', buildNextImageSrcSet(src, [...PREFETCH_WIDTHS], DETAIL_IMAGE_QUALITY));
      link.setAttribute('imagesizes', DETAIL_IMAGE_SIZES);
    } else {
      // 폴백: 단일 대표 폭(품질 일치).
      link.setAttribute('href', buildNextImageUrl(src, FALLBACK_WIDTH, DETAIL_IMAGE_QUALITY));
    }

    document.head.appendChild(link);
  }, []);
}

/**
 * workId만 아는 호출부(캡션 링크 hover 등)를 위한 브릿지 훅.
 * 이미 클라이언트 캐시에 있는 작품 데이터(상세 또는 published 목록)에서 Work를 찾아
 * 추가 네트워크 조회 없이 첫 이미지를 prefetch 한다.
 *
 * @returns `(workId: string) => void`
 */
export function usePrefetchFirstImageByWorkId(): (workId: string) => void {
  const queryClient = useQueryClient();
  const prefetchFirstImage = usePrefetchFirstImage();

  return useCallback(
    (workId: string) => {
      if (!workId) return;

      // 1) 상세 캐시 우선
      let work = queryClient.getQueryData<Work | undefined>(queryKeys.works.detail(workId));

      // 2) 없으면 published 목록 캐시에서 탐색(추가 조회 없음)
      if (!work) {
        const published = queryClient.getQueryData<Work[] | undefined>(queryKeys.works.published());
        work = published?.find((w) => w.id === workId);
      }

      if (work) {
        prefetchFirstImage(work);
      }
    },
    [queryClient, prefetchFirstImage]
  );
}

/** 테스트 전용: prefetch 기록 초기화. */
export function __resetPrefetchedKeysForTest(): void {
  prefetchedKeys.clear();
}
