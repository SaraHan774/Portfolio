'use client';

/**
 * 작품 상세 페이지
 *
 * PortfolioLayout에서 CategorySidebar와 WorkListScroller를 공유
 * 이 페이지는 작품 이미지와 캡션만 렌더링
 *
 * 주요 기능:
 * - 작품 미디어(이미지/비디오) 표시
 * - 스크롤에 따른 현재 보이는 이미지 추적
 * - 캡션 내 작품 링크 hover/click 처리
 * - 작품 상세 모달 표시
 */

import { useParams, useSearchParams } from 'next/navigation';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Spinner,
  FloatingWorkWindow,
  YouTubeEmbed,
  FadeInImage,
  WorkModal,
  CaptionWithBoundary,
  MediaTimeline,
  AnimatedCharacterText,
} from '@/presentation';
import { getMediaItems, hasMedia } from '@/core/utils';
import { useCategorySelection } from '@/state';
import { useWork, useCaptionHoverEvents } from '@/domain';

/**
 * 스크롤 감지 상수
 */
const SCROLL_CONSTANTS = {
  /** 하단 도달 판정 임계값 (px) */
  BOTTOM_THRESHOLD: 50,
  /** IntersectionObserver 임계값 */
  INTERSECTION_THRESHOLDS: [0, 0.5, 1] as number[],
  /** 스크롤 이벤트 지연 시간 (ms) */
  SCROLL_DELAY: 100,
  /** 중앙 기준 점수 계산 기준값 */
  CENTER_SCORE_BASE: 1000,
} as const;

/**
 * Caption 내부의 작품 링크 컴포넌트
 */
function CaptionLink({
  workId,
  captionId,
  text,
}: {
  workId: string;
  captionId: string;
  text: string;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <a
      href="#"
      data-caption-id={captionId}
      data-work-id={workId}
      style={{
        cursor: 'pointer',
        textDecoration: 'none',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatedCharacterText
        text={text}
        isActive={isHovered}
        isSelected={false}
        hasBeenClickedBefore={true}
        characterStyle={(isActive) =>
          isActive
            ? {
                color: 'transparent',
                WebkitTextStroke: '0.7px var(--color-category-hover-stroke)',
              }
            : {
                color: 'var(--color-text-primary)',
              }
        }
      />
    </a>
  );
}

/**
 * 캡션 렌더링 함수
 * 캡션 HTML 문자열을 파싱하여 작품 링크에 AnimatedCharacterText 적용
 */
function renderCaption(
  caption: string | undefined,
  captionId: string,
  isModal: boolean = false
): React.ReactNode {
  if (!caption) return null;

  const parser = new DOMParser();
  const doc = parser.parseFromString(caption, 'text/html');

  // HTML 노드를 React 요소로 변환하는 재귀 함수
  const convertNodeToReact = (node: Node, index: number): React.ReactNode => {
    // 텍스트 노드
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent;
    }

    // 요소 노드
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      const tagName = element.tagName.toLowerCase();

      // 작품 링크인 경우
      if (tagName === 'a' && element.getAttribute('data-work-id')) {
        const linkWorkId = element.getAttribute('data-work-id');
        const linkText = element.textContent || '';

        return (
          <CaptionLink
            key={`${captionId}-link-${index}`}
            workId={linkWorkId || ''}
            captionId={captionId}
            text={linkText}
          />
        );
      }

      // 일반 요소 (p, span 등)
      const children = Array.from(element.childNodes).map((child, childIndex) =>
        convertNodeToReact(child, childIndex)
      );

      return React.createElement(
        tagName,
        { key: `${captionId}-${tagName}-${index}` },
        ...children
      );
    }

    return null;
  };

  const bodyChildren = Array.from(doc.body.childNodes).map((node, index) =>
    convertNodeToReact(node, index)
  );

  return (
    <div
      key={captionId}
      data-caption-container-id={captionId}
      data-is-modal={isModal ? 'true' : 'false'}
      style={{
        fontSize: 'var(--font-size-sm)',
        color: 'var(--color-gray-700)',
        lineHeight: 'var(--line-height-normal)',
        textAlign: 'left',
        whiteSpace: 'pre-wrap',
      }}
    >
      {bodyChildren}
    </div>
  );
}

export default function WorkDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const workId = params.id as string;

  // URL에서 전달받은 카테고리 정보
  const urlKeywordId = searchParams.get('keywordId');
  const urlExhibitionId = searchParams.get('exhibitionId');

  // Global state에서 선택된 카테고리 정보 및 액션 가져오기
  const { selectedKeywordId, selectedExhibitionCategoryId, selectKeyword, selectExhibitionCategory } = useCategorySelection();

  // 상태 관리
  const [currentImageId, setCurrentImageId] = useState<string | null>(null);
  const [modalWorkId, setModalWorkId] = useState<string | null>(null);

  // Fetch work data
  const { data: work, isLoading } = useWork(workId);

  // Caption hover events 설정
  const { hoveredWorkId, hoverPosition, clearHover } = useCaptionHoverEvents({
    containerSelector: '[data-caption-container-id]',
    hoverDelay: 400,
    hideDelay: 200,
    currentWorkId: work?.id,
    dependencies: [work, renderCaption],
  });

  // Hover 중인 작업 데이터
  const { data: hoveredWork } = useWork(hoveredWorkId || '');

  // Refs
  const imageScrollContainerRef = useRef<HTMLDivElement>(null);

  // 모달이 열릴 때 hover 상태 초기화
  useEffect(() => {
    if (modalWorkId) {
      clearHover();
    }
  }, [modalWorkId, clearHover]);

  /**
   * 작품 데이터 로드 시 카테고리 초기화
   * 
   * 1. URL 파라미터로 카테고리가 전달되면 해당 카테고리를 global state에 설정
   * 2. URL 파라미터가 없으면 작품의 첫 번째 카테고리를 사용
   * 
   * 이 로직은 직접 URL로 접근 시 PortfolioLayout이 올바르게 초기화되도록 보장합니다.
   */
  useEffect(() => {
    if (!work) return;

    // 첫 번째 미디어 ID 설정
    const mediaItems = getMediaItems(work);
    if (mediaItems.length > 0) {
      setCurrentImageId(mediaItems[0].data.id);
    }

    // URL 파라미터가 있으면 global state 업데이트
    if (urlKeywordId) {
      selectKeyword(urlKeywordId);
    } else if (urlExhibitionId) {
      selectExhibitionCategory(urlExhibitionId);
    } 
    // URL 파라미터가 없으면 작품의 첫 번째 카테고리를 기본값으로 사용
    else {
      if (work.sentenceCategoryIds.length > 0 && !selectedKeywordId) {
        selectKeyword(work.sentenceCategoryIds[0]);
      } else if (work.exhibitionCategoryIds.length > 0 && !selectedExhibitionCategoryId) {
        selectExhibitionCategory(work.exhibitionCategoryIds[0]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [work, workId, urlKeywordId, urlExhibitionId]);

  /**
   * 현재 보이는 이미지를 감지하는 로직
   * 
   * 로직:
   * 1. 스크롤이 하단에 도달하면 마지막 이미지를 선택
   * 2. 그 외의 경우 화면 중앙에 가장 가까운 이미지를 선택
   */
  useEffect(() => {
    if (!work) return;

    const timeoutId = setTimeout(() => {
      let lastTrackedImageId: string | null = null;

      /**
       * 현재 보이는 이미지 업데이트
       */
      const updateCurrentImage = () => {
        const allImages = Array.from(document.querySelectorAll<HTMLElement>('[data-image-id]'));
        if (allImages.length === 0) return;

        const scrollTop = window.scrollY;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const isAtBottom = scrollTop + windowHeight >= documentHeight - SCROLL_CONSTANTS.BOTTOM_THRESHOLD;

        // 하단 도달 시 마지막 이미지 선택
        if (isAtBottom) {
          const lastImage = allImages[allImages.length - 1];
          const imageId = lastImage.getAttribute('data-image-id');
          if (imageId && imageId !== lastTrackedImageId) {
            lastTrackedImageId = imageId;
            setCurrentImageId(imageId);
          }
          return;
        }

        // 화면 중앙에 가장 가까운 이미지 선택
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
            const score = SCROLL_CONSTANTS.CENTER_SCORE_BASE - distanceFromCenter;

            if (score > bestScore) {
              bestScore = score;
              bestImage = img;
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

      // IntersectionObserver 설정
      const observer = new IntersectionObserver(
        updateCurrentImage,
        {
          rootMargin: '0px',
          threshold: SCROLL_CONSTANTS.INTERSECTION_THRESHOLDS,
        }
      );

      // 모든 이미지 요소 관찰 시작
      const imageElements = document.querySelectorAll('[data-image-id]');
      imageElements.forEach((el) => observer.observe(el));

      // 스크롤 이벤트 리스너 등록
      window.addEventListener('scroll', updateCurrentImage, { passive: true });

      // 정리 함수
      return () => {
        clearTimeout(timeoutId);
        observer.disconnect();
        window.removeEventListener('scroll', updateCurrentImage);
      };
    }, SCROLL_CONSTANTS.SCROLL_DELAY);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [work, workId]);

  // 캡션 내 링크 클릭 이벤트 처리 (이벤트 위임)
  useEffect(() => {
    const handleLinkClick = (e: Event) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[data-work-id]') as HTMLElement;

      // 캡션 컨테이너 내부의 링크만 처리 (모달이 아닌 경우)
      const captionContainer = link?.closest('[data-is-modal="false"]');
      if (link && captionContainer) {
        e.preventDefault();
        const clickedWorkId = link.getAttribute('data-work-id');
        if (clickedWorkId) {
          clearHover(); // Hover 상태 초기화
          setModalWorkId(clickedWorkId);
        }
      }
    };

    // document.body에 이벤트 위임으로 부착 (동적 링크 포함)
    document.body.addEventListener('click', handleLinkClick);

    return () => {
      document.body.removeEventListener('click', handleLinkClick);
    };
  }, [clearHover]);

  // 현재 작품의 미디어 아이템
  const sortedMedia = useMemo(() => {
    if (!work) return [];
    return getMediaItems(work);
  }, [work]);

  return (
    <>
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
          }}
        >
          {/* 선택된 작품의 미디어 표시 */}
          <AnimatePresence mode="sync">
            {work && hasMedia(work) && (
              <motion.div
                key={workId}
                initial={{ opacity: 0.85 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0.85 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
              >
                {/* 컨텐츠 영역: 미디어 + 캡션 */}
                {/* 좌측에 이미지 표시 (PortfolioLayout이 paddingTop 제공) */}
                <div
                  style={{
                    display: 'flex',
                    width: '100%',
                    justifyContent: 'flex-start', // 항상 좌측에 표시
                  }}
                >
                  {/* 미디어 영역 */}
                  <div
                    style={{
                      width: 'calc(50% - var(--content-gap))',
                      paddingLeft: sortedMedia.length > 1 ? 'calc(var(--space-12))' : 'var(--space-8)',
                      paddingRight: 'var(--space-6)',
                      paddingBottom: 'var(--space-10)',
                      position: 'relative',
                    }}
                  >
                    <div ref={imageScrollContainerRef} style={{ position: 'relative' }}>
                      {/* 타임라인 UI */}
                      {sortedMedia.length > 1 && (
                        <MediaTimeline
                          mediaItems={sortedMedia}
                          currentMediaId={currentImageId}
                          positionStyle={{
                            position: 'fixed',
                            left: 'var(--category-margin-left)',
                            top: 0,
                          }}
                        />
                      )}

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
                              alt={work.title}
                              width={item.data.width}
                              height={item.data.height}
                              priority={isFirst}
                              style={{
                                width: '100%',
                                height: 'auto',
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 우측: 캡션 - fixed로 하단 고정 */}
                {work.caption && (
                  <CaptionWithBoundary
                    caption={work.caption}
                    captionId={work.id}
                    renderCaption={renderCaption}
                    mediaContainerRef={imageScrollContainerRef}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      )}

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
        {hoveredWorkId && hoverPosition && hoveredWork && !modalWorkId && (
          <FloatingWorkWindow
            work={hoveredWork}
            position={hoverPosition}
            onClick={(clickedWorkId) => {
              clearHover();
              setModalWorkId(clickedWorkId);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
