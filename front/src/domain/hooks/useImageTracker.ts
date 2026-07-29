import { useState, useEffect, type RefObject } from 'react';
import { getMediaItems } from '@/core/utils';
import type { Work } from '@/core/types';

/**
 * 모달 내 현재 표시 중인 미디어 아이템 추적 hook
 *
 * - workId/modalWork 변경 시 첫 번째 미디어 ID로 초기화
 * - IntersectionObserver + scroll 이벤트로 화면 중앙에 가장 가까운 이미지 추적
 * - 스크롤 끝 도달 시 마지막 미디어 활성화
 */
export function useImageTracker(
  containerRef: RefObject<HTMLElement | null>,
  modalWork: Work | undefined,
  workId: string
): {
  currentImageId: string | null;
  setCurrentImageId: React.Dispatch<React.SetStateAction<string | null>>;
} {
  const [currentImageId, setCurrentImageId] = useState<string | null>(null);

  // modalWork 또는 workId 변경 시 첫 번째 미디어 ID로 초기화
  // (effect에서 setState 하는 대신, 렌더 중 직전 prop을 state로 추적해 동기적으로 재설정 —
  //  React 공식 "prop 변경 시 state 조정" 패턴: https://react.dev/reference/react/useState)
  const [prevWork, setPrevWork] = useState<Work | undefined>(undefined);
  const [prevWorkId, setPrevWorkId] = useState<string | undefined>(undefined);
  if (prevWork !== modalWork || prevWorkId !== workId) {
    setPrevWork(modalWork);
    setPrevWorkId(workId);
    if (modalWork) {
      const mediaItems = getMediaItems(modalWork);
      if (mediaItems.length > 0) {
        setCurrentImageId(mediaItems[0].data.id);
      }
    }
  }

  // IntersectionObserver + scroll 이벤트로 현재 미디어 추적
  useEffect(() => {
    if (!modalWork || !currentImageId || !containerRef.current) return;

    const container = containerRef.current;
    const imageElements = container.querySelectorAll('[data-image-id]');
    const sortedMedia = getMediaItems(modalWork);
    let lastTrackedImageId: string | null = null;

    const updateCurrentImage = () => {
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 30;

      // 맨 끝에 도달하면 마지막 미디어 활성화
      if (isAtBottom && sortedMedia.length > 0) {
        const lastMedia = sortedMedia[sortedMedia.length - 1];
        if (lastMedia.data.id !== lastTrackedImageId) {
          lastTrackedImageId = lastMedia.data.id;
          setCurrentImageId(lastMedia.data.id);
        }
        return;
      }

      // 화면 중앙에 가장 가까운 이미지 찾기
      const allImages = Array.from(
        container.querySelectorAll('[data-image-id]')
      ) as HTMLElement[];
      let bestImage: HTMLElement | null = null;
      let bestScore = -Infinity;
      const containerRect = container.getBoundingClientRect();
      const containerCenter = containerRect.top + containerRect.height / 2;

      allImages.forEach((img) => {
        const rect = img.getBoundingClientRect();
        const imageCenter = rect.top + rect.height / 2;
        const isVisible =
          rect.bottom > containerRect.top && rect.top < containerRect.bottom;

        if (isVisible) {
          const distanceFromCenter = Math.abs(imageCenter - containerCenter);
          const score = 1000 - distanceFromCenter;
          if (score > bestScore) {
            bestScore = score;
            bestImage = img as HTMLElement;
          }
        }
      });

      if (bestImage !== null) {
        const imageId = (bestImage as HTMLElement).getAttribute('data-image-id');
        if (imageId && imageId !== lastTrackedImageId) {
          lastTrackedImageId = imageId;
          setCurrentImageId(imageId);
        }
      }
    };

    const observer = new IntersectionObserver(() => updateCurrentImage(), {
      root: container,
      rootMargin: '-20% 0px -60% 0px',
      threshold: [0, 0.25, 0.5, 0.75, 1],
    });

    imageElements.forEach((el) => observer.observe(el));
    container.addEventListener('scroll', updateCurrentImage, { passive: true });

    return () => {
      imageElements.forEach((el) => observer.unobserve(el));
      container.removeEventListener('scroll', updateCurrentImage);
    };
  }, [modalWork, currentImageId, containerRef]);

  return { currentImageId, setCurrentImageId };
}
