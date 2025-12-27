'use client';

/**
 * 작품 상세 페이지
 * 선택된 작품의 이미지/영상을 표시하고 관련 작품 탐색 기능 제공
 */

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Footer,
  CategorySidebar,
  WorkListScroller,
  Spinner,
  FloatingWorkWindow,
  YouTubeEmbed,
  FadeInImage,
  WorkModal,
  CaptionWithBoundary,
} from '@/presentation';
import { getMediaItems, hasMedia } from '@/core/utils';
import { useCategories } from '@/state';
import { useWork, useWorksByKeyword, useWorksByExhibitionCategory } from '@/domain';
import type { Work } from '@/types';

/**
 * 캡션 렌더링 함수
 * 캡션 HTML 문자열을 파싱하여 작품 링크에 스타일과 이벤트 속성 추가
 */
function renderCaption(
  caption: string | undefined,
  captionId: string,
  isModal: boolean = false
): React.ReactNode {
  if (!caption) return null;

  const parser = new DOMParser();
  const doc = parser.parseFromString(caption, 'text/html');
  const links = doc.querySelectorAll('a[data-work-id]');

  links.forEach((linkElement) => {
    const link = linkElement as HTMLElement;
    const linkWorkId = link.getAttribute('data-work-id');
    if (linkWorkId) {
      link.setAttribute('href', '#');
      link.style.color = 'var(--color-text-primary)';
      link.style.textDecoration = 'underline';
      link.style.cursor = 'pointer';
      link.setAttribute('data-caption-id', captionId);
      link.setAttribute('data-work-id', linkWorkId);
    }
  });

  return (
    <div
      key={captionId}
      data-caption-container-id={captionId}
      data-is-modal={isModal ? 'true' : 'false'}
      dangerouslySetInnerHTML={{ __html: doc.body.innerHTML }}
      style={{
        fontSize: 'var(--font-size-xs)',
        color: 'var(--color-category-disabled)',
        lineHeight: 'var(--line-height-normal)',
        maxWidth: '200px',
        textAlign: 'left',
      }}
    />
  );
}

export default function WorkDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const workId = params.id as string;

  // URL에서 전달받은 카테고리 정보
  const urlKeywordId = searchParams.get('keywordId');
  const urlExhibitionId = searchParams.get('exhibitionId');

  // 카테고리 데이터 (Context에서 가져옴 - 페이지 이동 시 깜빡임 방지)
  const { sentenceCategories, exhibitionCategories } = useCategories();

  // 상태 관리
  const [selectedKeywordId, setSelectedKeywordId] = useState<string | null>(urlKeywordId);
  const [selectedExhibitionCategoryId, setSelectedExhibitionCategoryId] = useState<string | null>(urlExhibitionId);
  const [currentImageId, setCurrentImageId] = useState<string | null>(null);
  const [selectedWorkId, setSelectedWorkId] = useState<string | null>(workId);
  const [hoveredWorkId, setHoveredWorkId] = useState<string | null>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [modalWorkId, setModalWorkId] = useState<string | null>(null);
  const [sentenceCategoryHeight, setSentenceCategoryHeight] = useState<number>(0);
  const [exhibitionCategoryHeight, setExhibitionCategoryHeight] = useState<number>(0);
  const [leftWorkListHeight, setLeftWorkListHeight] = useState<number>(0);
  const [rightWorkListHeight, setRightWorkListHeight] = useState<number>(0);

  // Fetch work data using domain hooks
  const { data: work, isLoading } = useWork(workId);
  const { data: keywordWorks = [] } = useWorksByKeyword(selectedKeywordId || undefined);
  const { data: exhibitionWorks = [] } = useWorksByExhibitionCategory(
    selectedExhibitionCategoryId || undefined
  );

  // Determine related works based on selected category
  const relatedWorks = selectedKeywordId ? keywordWorks : selectedExhibitionCategoryId ? exhibitionWorks : [];

  // Refs
  const imageScrollContainerRef = useRef<HTMLDivElement>(null);
  const leftWorkListRef = useRef<HTMLDivElement>(null);
  const rightWorkListRef = useRef<HTMLDivElement>(null);
  const hoverPositionRef = useRef({ x: 0, y: 0 });
  const hoveredWorkIdRef = useRef<string | null>(null);
  const observerRef = useRef<MutationObserver | null>(null);
  const hoverLinkTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInSafeZoneRef = useRef<boolean>(true);

  // 선택된 카테고리의 작품 ID 목록 (disabled 상태 계산용)
  const selectedWorkIds = useMemo(() => relatedWorks.map((w) => w.id), [relatedWorks]);

  // hoverPosition이 변경될 때마다 ref 업데이트
  useEffect(() => {
    hoverPositionRef.current = hoverPosition;
  }, [hoverPosition]);

  // hoveredWorkId가 변경될 때마다 ref 업데이트
  useEffect(() => {
    hoveredWorkIdRef.current = hoveredWorkId;
  }, [hoveredWorkId]);

  // 작품 데이터 로드 시 초기화
  useEffect(() => {
    if (!work) return;

    setSelectedWorkId(workId);

    // 첫 번째 미디어 ID 설정
    const mediaItems = getMediaItems(work);
    if (mediaItems.length > 0) {
      setCurrentImageId(mediaItems[0].data.id);
    }

    // URL 파라미터가 없으면 작품의 첫 번째 카테고리를 기본값으로 사용
    if (!urlKeywordId && !urlExhibitionId) {
      if (work.sentenceCategoryIds.length > 0 && !selectedKeywordId) {
        setSelectedKeywordId(work.sentenceCategoryIds[0]);
        setSelectedExhibitionCategoryId(null);
      } else if (work.exhibitionCategoryIds.length > 0 && !selectedExhibitionCategoryId) {
        setSelectedExhibitionCategoryId(work.exhibitionCategoryIds[0]);
        setSelectedKeywordId(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [work, workId]);

  // 좌측 작업 목록 높이 측정
  useEffect(() => {
    const element = leftWorkListRef.current;
    if (!element) {
      setLeftWorkListHeight(0);
      return;
    }

    const updateHeight = () => {
      const height = element.getBoundingClientRect().height;
      setLeftWorkListHeight(height);
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(() => {
      updateHeight();
    });
    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, [selectedKeywordId, relatedWorks]);

  // 우측 작업 목록 높이 측정
  useEffect(() => {
    const element = rightWorkListRef.current;
    if (!element) {
      setRightWorkListHeight(0);
      return;
    }

    const updateHeight = () => {
      const height = element.getBoundingClientRect().height;
      setRightWorkListHeight(height);
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(() => {
      updateHeight();
    });
    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, [selectedExhibitionCategoryId, relatedWorks]);

  // 스크롤 시 Floating Window 숨김
  useEffect(() => {
    if (!hoveredWorkId) return;

    const handleScroll = () => {
      setHoveredWorkId(null);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [hoveredWorkId]);

  // 마우스가 링크나 FloatingWindow 밖으로 나가면 사라짐
  useEffect(() => {
    if (!hoveredWorkId) {
      isInSafeZoneRef.current = true;
      return;
    }

    const checkSafeZone = (mouseX: number, mouseY: number): boolean => {
      const SAFE_MARGIN = 20;

      // 링크 영역 체크
      const links = document.querySelectorAll(`a[data-work-id="${hoveredWorkIdRef.current}"]`);
      let linkBottom = 0;
      let linkLeft = Infinity;
      let linkRight = 0;

      for (const link of links) {
        const rect = link.getBoundingClientRect();
        linkBottom = Math.max(linkBottom, rect.bottom);
        linkLeft = Math.min(linkLeft, rect.left);
        linkRight = Math.max(linkRight, rect.right);

        if (
          mouseX >= rect.left - SAFE_MARGIN &&
          mouseX <= rect.right + SAFE_MARGIN &&
          mouseY >= rect.top - SAFE_MARGIN &&
          mouseY <= rect.bottom + SAFE_MARGIN
        ) {
          return true;
        }
      }

      // FloatingWindow 영역 체크
      const floatingWindow = document.querySelector('[data-floating-window="true"]');
      if (floatingWindow) {
        const rect = floatingWindow.getBoundingClientRect();
        if (
          mouseX >= rect.left - SAFE_MARGIN &&
          mouseX <= rect.right + SAFE_MARGIN &&
          mouseY >= rect.top - SAFE_MARGIN &&
          mouseY <= rect.bottom + SAFE_MARGIN
        ) {
          return true;
        }

        // 링크와 FloatingWindow 사이 연결 영역 (세로)
        if (
          mouseY >= linkBottom - SAFE_MARGIN &&
          mouseY <= rect.top + SAFE_MARGIN &&
          mouseX >= Math.min(linkLeft, rect.left) - SAFE_MARGIN &&
          mouseX <= Math.max(linkRight, rect.right) + SAFE_MARGIN
        ) {
          return true;
        }
      } else if (linkBottom > 0) {
        // FloatingWindow 로딩 중일 때 링크 아래 영역 허용
        if (
          mouseY >= linkBottom - SAFE_MARGIN &&
          mouseY <= linkBottom + 180 &&
          mouseX >= linkLeft - 100 &&
          mouseX <= linkRight + 100
        ) {
          return true;
        }
      }

      return false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const isInSafeZone = checkSafeZone(e.clientX, e.clientY);

      if (isInSafeZone) {
        isInSafeZoneRef.current = true;
        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current);
          hideTimeoutRef.current = null;
        }
      } else if (isInSafeZoneRef.current) {
        isInSafeZoneRef.current = false;
        if (!hideTimeoutRef.current) {
          hideTimeoutRef.current = setTimeout(() => {
            setHoveredWorkId(null);
            hideTimeoutRef.current = null;
          }, 200);
        }
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
    };
  }, [hoveredWorkId]);

  // Intersection Observer로 현재 보이는 이미지 감지
  useEffect(() => {
    if (!selectedWorkId) return;

    const selectedWork =
      relatedWorks.find((w) => w.id === selectedWorkId) ||
      (selectedWorkId === workId ? work : null);

    if (!selectedWork) return;

    const mediaItems = getMediaItems(selectedWork);
    if (mediaItems.length > 0) {
      setCurrentImageId(mediaItems[0].data.id);
    }

    const timeoutId = setTimeout(() => {
      const imageElements = document.querySelectorAll('[data-image-id]');
      let lastTrackedImageId: string | null = null;

      const updateCurrentImage = () => {
        const allImages = Array.from(document.querySelectorAll('[data-image-id]'));

        const scrollTop = window.scrollY;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const isAtBottom = scrollTop + windowHeight >= documentHeight - 50;

        if (isAtBottom && allImages.length > 0) {
          const lastImage = allImages[allImages.length - 1] as HTMLElement;
          const imageId = lastImage.getAttribute('data-image-id');
          if (imageId && imageId !== lastTrackedImageId) {
            lastTrackedImageId = imageId;
            setCurrentImageId(imageId);
          }
          return;
        }

        let bestImage: HTMLElement | null = null;
        let bestScore = -Infinity;

        allImages.forEach((img) => {
          const rect = img.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          const viewportCenter = viewportHeight / 2;
          const imageCenter = rect.top + rect.height / 2;
          const isVisible = rect.bottom > 0 && rect.top < viewportHeight;

          if (isVisible) {
            const distanceFromCenter = Math.abs(imageCenter - viewportCenter);
            const score = 1000 - distanceFromCenter;

            if (score > bestScore) {
              bestScore = score;
              bestImage = img as HTMLElement;
            }
          }
        });

        if (bestImage) {
          const imageId = (bestImage as HTMLElement).getAttribute('data-image-id');
          if (imageId && imageId !== lastTrackedImageId) {
            lastTrackedImageId = imageId;
            setCurrentImageId(imageId);
          }
        }
      };

      const observer = new IntersectionObserver(
        () => {
          updateCurrentImage();
        },
        {
          rootMargin: '0px',
          threshold: [0, 0.5, 1],
        }
      );

      imageElements.forEach((el) => observer.observe(el));

      const handleScroll = () => {
        updateCurrentImage();
      };
      window.addEventListener('scroll', handleScroll, { passive: true });

      (
        window as Window & {
          __imageObserver?: IntersectionObserver;
          __scrollHandler?: () => void;
        }
      ).__imageObserver = observer;
      (
        window as Window & {
          __imageObserver?: IntersectionObserver;
          __scrollHandler?: () => void;
        }
      ).__scrollHandler = handleScroll;
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      const windowWithHandlers = window as Window & {
        __imageObserver?: IntersectionObserver;
        __scrollHandler?: () => void;
      };
      if (windowWithHandlers.__imageObserver) {
        windowWithHandlers.__imageObserver.disconnect();
      }
      if (windowWithHandlers.__scrollHandler) {
        window.removeEventListener('scroll', windowWithHandlers.__scrollHandler);
      }
    };
  }, [selectedWorkId, work, relatedWorks, workId]);

  // 캡션 내 링크에 호버 이벤트 추가
  useEffect(() => {
    if (!work) return;

    const eventHandlers = new Map<
      HTMLElement,
      {
        enter: (e: Event) => void;
        leave: () => void;
        move: (e: Event) => void;
        click: (e: Event) => void;
      }
    >();

    const handleLinkMouseEnter = (e: Event) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[data-work-id]') as HTMLElement;
      if (link) {
        const linkWorkId = link.getAttribute('data-work-id');
        if (linkWorkId) {
          if (hoverLinkTimeoutRef.current) {
            clearTimeout(hoverLinkTimeoutRef.current);
            hoverLinkTimeoutRef.current = null;
          }
          if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
          }

          hoverLinkTimeoutRef.current = setTimeout(() => {
            const rect = link.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.bottom;

            isInSafeZoneRef.current = true;

            setHoverPosition({ x, y });
            setHoveredWorkId(linkWorkId);
            hoverLinkTimeoutRef.current = null;
          }, 400);
        }
      }
    };

    const handleLinkMouseLeave = () => {
      if (hoverLinkTimeoutRef.current) {
        clearTimeout(hoverLinkTimeoutRef.current);
        hoverLinkTimeoutRef.current = null;
      }
    };

    const handleLinkMouseMove = () => {};

    const handleLinkClick = (e: Event) => {
      e.preventDefault();
      const target = e.target as HTMLElement;
      const link = target.closest('a[data-work-id]') as HTMLElement;
      if (link) {
        const clickedWorkId = link.getAttribute('data-work-id');
        if (clickedWorkId) {
          if (hoverLinkTimeoutRef.current) {
            clearTimeout(hoverLinkTimeoutRef.current);
            hoverLinkTimeoutRef.current = null;
          }
          setHoveredWorkId(null);
          hoveredWorkIdRef.current = null;
          setModalWorkId(clickedWorkId);
        }
      }
    };

    const attachEventListeners = (container: Element) => {
      const links = container.querySelectorAll('a[data-work-id]');
      links.forEach((link) => {
        const linkElement = link as HTMLElement;

        const existingHandlers = eventHandlers.get(linkElement);
        if (existingHandlers) {
          linkElement.removeEventListener('mouseenter', existingHandlers.enter);
          linkElement.removeEventListener('mouseleave', existingHandlers.leave);
          linkElement.removeEventListener('mousemove', existingHandlers.move);
          linkElement.removeEventListener('click', existingHandlers.click);
        }

        const handlers = {
          enter: handleLinkMouseEnter,
          leave: handleLinkMouseLeave,
          move: handleLinkMouseMove,
          click: handleLinkClick,
        };
        eventHandlers.set(linkElement, handlers);

        linkElement.addEventListener('mouseenter', handlers.enter);
        linkElement.addEventListener('mouseleave', handlers.leave);
        linkElement.addEventListener('mousemove', handlers.move);
        linkElement.addEventListener('click', handlers.click);
      });
    };

    const setupEventListeners = () => {
      eventHandlers.forEach((handlers, link) => {
        link.removeEventListener('mouseenter', handlers.enter);
        link.removeEventListener('mouseleave', handlers.leave);
        link.removeEventListener('mousemove', handlers.move);
        link.removeEventListener('click', handlers.click);
      });
      eventHandlers.clear();

      const captionContainers = document.querySelectorAll('[data-caption-container-id]');
      captionContainers.forEach(attachEventListeners);

      const observer = new MutationObserver(() => {
        const allContainers = document.querySelectorAll('[data-caption-container-id]');
        allContainers.forEach((container) => {
          const links = container.querySelectorAll('a[data-work-id]');
          links.forEach((link) => {
            const linkElement = link as HTMLElement;
            if (!eventHandlers.has(linkElement)) {
              const handlers = {
                enter: handleLinkMouseEnter,
                leave: handleLinkMouseLeave,
                move: handleLinkMouseMove,
                click: handleLinkClick,
              };
              eventHandlers.set(linkElement, handlers);
              linkElement.addEventListener('mouseenter', handlers.enter);
              linkElement.addEventListener('mouseleave', handlers.leave);
              linkElement.addEventListener('mousemove', handlers.move);
              linkElement.addEventListener('click', handlers.click);
            }
          });
        });
      });

      const mainElement = document.querySelector('main');
      if (mainElement) {
        observer.observe(mainElement, {
          childList: true,
          subtree: true,
        });
      }

      return observer;
    };

    const timeoutId = setTimeout(() => {
      const observer = setupEventListeners();
      observerRef.current = observer;
    }, 100);

    const recheckTimeoutId = setTimeout(() => {
      const captionContainers = document.querySelectorAll('[data-caption-container-id]');
      captionContainers.forEach(attachEventListeners);
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(recheckTimeoutId);

      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      eventHandlers.forEach((handlers, link) => {
        link.removeEventListener('mouseenter', handlers.enter);
        link.removeEventListener('mouseleave', handlers.leave);
        link.removeEventListener('mousemove', handlers.move);
        link.removeEventListener('click', handlers.click);
      });
      eventHandlers.clear();

      if (hoverLinkTimeoutRef.current) {
        clearTimeout(hoverLinkTimeoutRef.current);
        hoverLinkTimeoutRef.current = null;
      }
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
    };
  }, [work, selectedWorkId]);

  // 작품 선택 핸들러 - URL 업데이트 포함
  const handleWorkSelect = useCallback(
    (newWorkId: string) => {
      setSelectedWorkId(newWorkId);

      const params = new URLSearchParams();
      if (selectedKeywordId) {
        params.set('keywordId', selectedKeywordId);
      } else if (selectedExhibitionCategoryId) {
        params.set('exhibitionId', selectedExhibitionCategoryId);
      }

      const queryString = params.toString();
      const newUrl = `/works/${newWorkId}${queryString ? `?${queryString}` : ''}`;

      window.history.replaceState(null, '', newUrl);
    },
    [selectedKeywordId, selectedExhibitionCategoryId]
  );

  // 카테고리 선택 핸들러 - React Query hooks will handle data fetching
  const handleKeywordSelect = useCallback(
    (keywordId: string) => {
      setSelectedKeywordId(keywordId);
      setSelectedExhibitionCategoryId(null);
      setSelectedWorkId(null);

      const newUrl = `/works/${workId}?keywordId=${keywordId}`;
      router.replace(newUrl, { scroll: false });
    },
    [workId, router]
  );

  const handleExhibitionCategorySelect = useCallback(
    (categoryId: string) => {
      setSelectedExhibitionCategoryId(categoryId);
      setSelectedKeywordId(null);
      setSelectedWorkId(null);

      const newUrl = `/works/${workId}?exhibitionId=${categoryId}`;
      router.replace(newUrl, { scroll: false });
    },
    [workId, router]
  );

  // 컨텐츠 상단 패딩 계산
  const contentPaddingTop = useMemo(() => {
    const categoryStart = 64; // var(--space-8)
    const gapBetweenCategoryAndWorkList = 24;
    const gapBetweenWorkListAndContent = 40;

    if (selectedKeywordId && leftWorkListHeight > 0) {
      return `${categoryStart + sentenceCategoryHeight + gapBetweenCategoryAndWorkList + leftWorkListHeight + gapBetweenWorkListAndContent}px`;
    } else if (selectedExhibitionCategoryId && rightWorkListHeight > 0) {
      return `${categoryStart + exhibitionCategoryHeight + gapBetweenCategoryAndWorkList + rightWorkListHeight + gapBetweenWorkListAndContent}px`;
    }
    return '200px';
  }, [
    selectedKeywordId,
    selectedExhibitionCategoryId,
    leftWorkListHeight,
    rightWorkListHeight,
    sentenceCategoryHeight,
    exhibitionCategoryHeight,
  ]);

  // 현재 선택된 작품 데이터
  const displayWork = useMemo(() => {
    if (!selectedWorkId) return null;
    return (
      relatedWorks.find((w) => w.id === selectedWorkId) ||
      (selectedWorkId === workId ? work : null)
    );
  }, [selectedWorkId, relatedWorks, workId, work]);

  // 현재 작품의 미디어 아이템
  const sortedMedia = useMemo(() => {
    if (!displayWork) return [];
    return getMediaItems(displayWork);
  }, [displayWork]);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 relative" style={{ paddingTop: '0' }}>
        {/* 카테고리 영역 */}
        <CategorySidebar
          sentenceCategories={sentenceCategories}
          exhibitionCategories={exhibitionCategories}
          selectedKeywordId={selectedKeywordId}
          selectedExhibitionCategoryId={selectedExhibitionCategoryId}
          onKeywordSelect={handleKeywordSelect}
          onExhibitionCategorySelect={handleExhibitionCategorySelect}
          selectedWorkIds={selectedWorkIds}
          onSentenceCategoryHeightChange={setSentenceCategoryHeight}
          onExhibitionCategoryHeightChange={setExhibitionCategoryHeight}
        />

        {/* 작업 목록 영역 - 좌측 (문장형 카테고리 선택 시) */}
        {relatedWorks.length > 0 && selectedKeywordId && (
          <div
            ref={leftWorkListRef}
            className="hidden lg:block absolute"
            style={{
              left: 'var(--category-margin-left)',
              top: `calc(var(--space-8) + ${sentenceCategoryHeight}px + 24px)`,
              maxWidth: 'calc(50% - var(--content-gap) - var(--category-margin-left))',
              zIndex: 100,
            }}
          >
            <motion.div
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <WorkListScroller
                works={relatedWorks}
                selectedWorkId={selectedWorkId}
                onWorkSelect={handleWorkSelect}
                showThumbnail={selectedWorkId === null}
                direction="ltr"
              />
            </motion.div>
          </div>
        )}

        {/* 작업 목록 영역 - 우측 (전시명 카테고리 선택 시) */}
        {relatedWorks.length > 0 && selectedExhibitionCategoryId && (
          <div
            ref={rightWorkListRef}
            className="hidden lg:block absolute"
            style={{
              right: 'var(--category-margin-right)',
              top: `calc(var(--space-8) + ${exhibitionCategoryHeight}px + 24px)`,
              textAlign: 'right',
              maxWidth: 'calc(50% - var(--content-gap) - var(--category-margin-right))',
              zIndex: 100,
            }}
          >
            <motion.div
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <WorkListScroller
                works={relatedWorks}
                selectedWorkId={selectedWorkId}
                onWorkSelect={handleWorkSelect}
                showThumbnail={selectedWorkId === null}
                direction="rtl"
              />
            </motion.div>
          </div>
        )}

        {/* 이미지 컨텐츠 영역 */}
        {isLoading || !work ? (
          <main
            style={{
              position: 'relative',
              minHeight: 'calc(100vh - 60px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Spinner size={24} />
          </main>
        ) : (
          <main
            style={{
              position: 'relative',
              minHeight: 'calc(100vh - 60px)',
              paddingTop: contentPaddingTop,
            }}
          >
            {/* 선택된 작품의 미디어 표시 */}
            <AnimatePresence mode="sync">
              {selectedWorkId && displayWork && hasMedia(displayWork) && (
                <motion.div
                  key={selectedWorkId}
                  initial={{ opacity: 0.85 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0.85 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                >
                  {/* 좌측 고정 타임라인 UI */}
                  {sortedMedia.length > 1 && (
                    <div
                      style={{
                        position: 'fixed',
                        left: 'var(--category-margin-left)',
                        top: '70%',
                        transform: 'translateY(-50%)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        zIndex: 50,
                      }}
                    >
                      {sortedMedia.map((item, index) => {
                        const isActive = currentImageId === item.data.id;
                        const isLast = index === sortedMedia.length - 1;

                        return (
                          <div
                            key={item.data.id}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                            }}
                          >
                            <button
                              onClick={() => {
                                const element = document.querySelector(
                                  `[data-image-id="${item.data.id}"]`
                                );
                                if (element) {
                                  element.scrollIntoView({
                                    behavior: 'smooth',
                                    block: 'start',
                                  });
                                }
                              }}
                              style={{
                                width: isActive ? '10px' : '6px',
                                height: isActive ? '10px' : '6px',
                                borderRadius: '50%',
                                backgroundColor: isActive
                                  ? 'var(--color-text-primary)'
                                  : 'var(--color-gray-400)',
                                border: 'none',
                                cursor: 'pointer',
                                transition:
                                  'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                                padding: 0,
                              }}
                              aria-label={`미디어 ${index + 1}로 이동`}
                            />
                            {!isLast && (
                              <div
                                style={{
                                  width: '1px',
                                  height: '50px',
                                  backgroundImage:
                                    'linear-gradient(var(--color-gray-300) 50%, transparent 50%)',
                                  backgroundSize: '1px 6px',
                                  backgroundRepeat: 'repeat-y',
                                  margin: '6px 0',
                                  transition:
                                    'height 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                                }}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* 컨텐츠 영역: 미디어 + 캡션 */}
                  <div
                    style={{
                      display: 'flex',
                      width: '100%',
                      alignItems: 'flex-start',
                    }}
                  >
                    {/* 좌측: 미디어 영역 (50%) */}
                    <div
                      style={{
                        width: '50%',
                        paddingLeft: 'var(--space-12)',
                        paddingRight: 'var(--space-6)',
                        paddingBottom: 'var(--space-10)',
                        position: 'relative',
                      }}
                    >
                      <div ref={imageScrollContainerRef}>
                        {sortedMedia.map((item, index) => {
                          const isLast = index === sortedMedia.length - 1;
                          const isFirst = index === 0;

                          if (item.type === 'video') {
                            return (
                              <div
                                key={item.data.id}
                                className="work-media-container"
                                style={{
                                  position: 'relative',
                                  width: '100%',
                                  scrollSnapAlign: 'start',
                                  scrollMarginTop: '280px',
                                }}
                              >
                                <YouTubeEmbed video={item.data} isLast={isLast} />
                              </div>
                            );
                          }

                          return (
                            <div
                              key={item.data.id}
                              data-image-id={item.data.id}
                              className="work-image-container"
                              style={{
                                marginBottom: isLast ? 0 : 'var(--space-10)',
                                position: 'relative',
                                width: '100%',
                                scrollSnapAlign: 'start',
                                scrollMarginTop: '280px',
                              }}
                            >
                              <FadeInImage
                                src={item.data.url}
                                alt={displayWork.title}
                                width={item.data.width}
                                height={item.data.height}
                                priority={isFirst}
                                style={{
                                  width: '100%',
                                  height: 'auto',
                                  borderRadius: '4px',
                                }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* 우측: 캡션 - fixed로 하단 고정 */}
                  {displayWork.caption && (
                    <CaptionWithBoundary
                      caption={displayWork.caption}
                      captionId={displayWork.id}
                      renderCaption={renderCaption}
                      mediaContainerRef={imageScrollContainerRef}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        )}
      </div>

      {/* 작품 상세 모달 */}
      <AnimatePresence>
        {modalWorkId && (
          <WorkModal
            workId={modalWorkId}
            onClose={() => setModalWorkId(null)}
            onWorkClick={(clickedWorkId) => setModalWorkId(clickedWorkId)}
            renderCaption={renderCaption}
          />
        )}
      </AnimatePresence>

      {/* 플로팅 작품 미리보기 */}
      <AnimatePresence>
        {hoveredWorkId &&
          (() => {
            const hoveredWork =
              relatedWorks.find((w) => w.id === hoveredWorkId) ||
              (hoveredWorkId === workId ? work : null);

            if (!hoveredWork) return null;

            return (
              <motion.div
                key="floating-window-container"
                className="floating-work-window-container"
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                exit={{
                  opacity: 0,
                  transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
                }}
                onMouseEnter={(e) => {
                  e.stopPropagation();
                }}
                style={{
                  position: 'fixed',
                  left: 0,
                  top: 0,
                  width: '100vw',
                  height: '100vh',
                  pointerEvents: 'none',
                  zIndex: 999,
                }}
              >
                <div style={{ pointerEvents: 'auto' }}>
                  <FloatingWorkWindow
                    work={hoveredWork}
                    position={hoverPosition}
                    onClick={(clickedWorkId) => {
                      setHoveredWorkId(null);
                      setModalWorkId(clickedWorkId);
                    }}
                  />
                </div>
              </motion.div>
            );
          })()}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
