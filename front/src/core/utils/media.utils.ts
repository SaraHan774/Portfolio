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
 * YouTube Video ID에서 순수 ID만 추출
 * list, index 등의 파라미터를 제거
 *
 * @param videoId - 원본 YouTube Video ID (파라미터 포함 가능)
 * @returns 순수 Video ID
 */
export function extractPureYouTubeVideoId(videoId: string): string {
  return videoId.split('?')[0].split('&')[0];
}

