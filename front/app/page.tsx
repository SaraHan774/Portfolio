import { ReactElement } from 'react';
import {
  DETAIL_IMAGE_SIZES,
  DETAIL_IMAGE_QUALITY,
} from '@/core/constants';
import { buildPreloadImageSrcSet } from '@/core/utils';
import { fetchFirstImageForPreload } from '@/data/api/worksServerApi';
import HomeClient from './HomeClient';

// Disable static generation (상세는 searchParams 기반, 매 요청 동적 렌더).
export const dynamic = 'force-dynamic';

/**
 * 홈페이지 (얇은 Server Component)
 *
 * 역할:
 * 1. URL에 workId가 있는 첫 진입(직접 링크/새로고침)이면, 서버에서 첫 이미지
 *    URL을 알아내 <head>에 <link rel="preload" as="image">를 주입한다.
 *    → 브라우저가 하이드레이션을 기다리지 않고 LCP 이미지를 즉시 받기 시작
 *      (CSR 워터폴로 인한 "Load Delay" 제거).
 * 2. 기존 클라이언트 UI는 HomeClient에서 그대로 렌더(동작 보존).
 *
 * preload는 best-effort다. 서버 조회가 null이면(미발행/이미지 없음/네트워크
 * 실패/타임아웃) 링크를 생략하므로 기존 동작과 동일하다.
 *
 * Next.js 16에서 page의 searchParams는 Promise이므로 await 한다.
 */
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<ReactElement> {
  const params = await searchParams;
  const rawWorkId = params.workId;
  const workId = Array.isArray(rawWorkId) ? rawWorkId[0] : rawWorkId;

  const preloadImage = workId ? await fetchFirstImageForPreload(workId) : null;

  return (
    <>
      {preloadImage && (
        // App Router에서 Server Component가 렌더한 <link>는 자동으로 <head>로 hoist된다.
        // imageSrcSet/imageSizes를 next/image 변형과 동일하게 맞춰 이중 다운로드를 방지.
        <link
          rel="preload"
          as="image"
          imageSrcSet={buildPreloadImageSrcSet(preloadImage.url, {
            quality: DETAIL_IMAGE_QUALITY,
          })}
          imageSizes={DETAIL_IMAGE_SIZES}
          fetchPriority="high"
        />
      )}
      <HomeClient />
    </>
  );
}
