// 미디어 관련 유틸리티 함수들

import type { Work, WorkImage, WorkVideo, MediaItem } from '@/types';

/**
 * 이미지와 영상을 통합 미디어 배열로 변환하는 헬퍼 함수
 * order 필드를 기준으로 정렬하여 반환
 *
 * @param work - 작업 객체
 * @returns 정렬된 미디어 아이템 배열
 */
export function getMediaItems(work: Work): MediaItem[] {
  const mediaItems: MediaItem[] = [];

  // 이미지 추가
  work.images.forEach((image) => {
    mediaItems.push({ type: 'image', data: image });
  });

  // 영상 추가
  if (work.videos) {
    work.videos.forEach((video) => {
      mediaItems.push({ type: 'video', data: video });
    });
  }

  // order 기준으로 정렬
  return mediaItems.sort((a, b) => a.data.order - b.data.order);
}

/**
 * YouTube embed URL에 컨트롤 최소화 파라미터를 추가하는 헬퍼 함수
 * 영상 플레이어의 UI 요소를 최소화하여 깔끔한 임베딩 제공
 *
 * @param embedUrl - 원본 YouTube embed URL
 * @returns 파라미터가 추가된 embed URL
 */
export function getMinimalYouTubeEmbedUrl(embedUrl: string): string {
  try {
    const url = new URL(embedUrl);

    // 컨트롤 및 UI 요소 최소화를 위한 파라미터 추가
    url.searchParams.set('controls', '0'); // 컨트롤 숨김
    url.searchParams.set('modestbranding', '1'); // YouTube 로고 최소화
    url.searchParams.set('rel', '0'); // 관련 영상 숨김
    url.searchParams.set('iv_load_policy', '3'); // 주석 숨김
    url.searchParams.set('disablekb', '1'); // 키보드 단축키 비활성화
    url.searchParams.set('fs', '0'); // 전체화면 버튼 숨김
    url.searchParams.set('cc_load_policy', '0'); // 자막 관련 UI 최소화
    url.searchParams.set('playsinline', '1'); // 모바일에서 인라인 재생
    url.searchParams.set('showinfo', '0'); // 영상 정보 숨김 (deprecated이지만 일부 버튼 숨김에 도움)

    return url.toString();
  } catch (error) {
    // URL 파싱 실패 시 원본 URL 반환
    console.error('YouTube embed URL 파싱 실패:', error);
    return embedUrl;
  }
}

/**
 * YouTube Video ID에서 순수 ID만 추출
 * list, index 등의 파라미터를 제거
 *
 * @param videoId - 원본 YouTube Video ID (파라미터 포함 가능)
 * @returns 순수 Video ID
 */
export function extractPureYouTubeVideoId(videoId: string): string {
  return videoId.split('?')[0].split('&')[0];
}

/**
 * 작업에 미디어(이미지 또는 영상)가 있는지 확인
 *
 * @param work - 작업 객체
 * @returns 미디어 존재 여부
 */
export function hasMedia(work: Work | null | undefined): boolean {
  if (!work) return false;
  return (work.images?.length || 0) > 0 || (work.videos?.length || 0) > 0;
}

