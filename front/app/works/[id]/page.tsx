'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/app/components/layout/Header';
import Footer from '@/app/components/layout/Footer';
import Sidebar from '@/app/components/layout/Sidebar';
import { getWorkById, getWorksByKeywordId, getWorksByExhibitionCategoryId } from '@/lib/services/worksService';
import { getSentenceCategories, getExhibitionCategories } from '@/lib/services/categoriesService';
import FloatingWorkWindow from '@/app/components/work/FloatingWorkWindow';
import type { Work, WorkImage, WorkVideo, MediaItem, ExhibitionCategory, SentenceCategory as SentenceCategoryType } from '@/types';

// 이미지와 영상을 통합 미디어 배열로 변환하는 헬퍼 함수
function getMediaItems(work: Work): MediaItem[] {
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

// YouTube 영상 Embed 컴포넌트
function YouTubeEmbed({ video, isLast = false }: { video: WorkVideo; isLast?: boolean }) {
  return (
    <div
      data-image-id={video.id}
      style={{
        marginBottom: isLast ? 0 : 'var(--space-10)',
        position: 'relative',
        width: '100%',
        paddingBottom: '56.25%', // 16:9 비율
        backgroundColor: '#000',
        borderRadius: '4px',
        overflow: 'hidden',
      }}
    >
      <iframe
        src={video.embedUrl}
        title={video.title || 'YouTube 영상'}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          border: 'none',
        }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

// Fade In 이미지 컴포넌트 (스켈레톤 포함)
function FadeInImage({
  src,
  alt,
  width,
  height,
  priority = false,
  style = {},
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  style?: React.CSSProperties;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const aspectRatio = height / width;

  // 1200ms 후에도 로딩 중이면 스켈레톤 표시
  useEffect(() => {
    if (isLoaded) return;

    const timer = setTimeout(() => {
      if (!isLoaded) {
        setShowSkeleton(true);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [isLoaded]);

  return (
    <div
      style={{
        position: 'relative',
        width: style.width || '100%',
        paddingBottom: `${aspectRatio * 100}%`,
        borderRadius: style.borderRadius || '4px',
        overflow: 'hidden',
      }}
    >
      {/* 스켈레톤 - 1200ms 후에도 로딩 중일 때만 표시 */}
      {!isLoaded && showSkeleton && (
        <div
          className="skeleton-shimmer"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
            borderRadius: style.borderRadius || '4px',
          }}
        />
      )}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        onLoad={() => setIsLoaded(true)}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          borderRadius: style.borderRadius || '4px',
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out',
        }}
      />
    </div>
  );
}

// 모달 내 이미지 컴포넌트 (fade in 효과)
function ModalImage({ image, alt, isLast }: { image: WorkImage; alt: string; isLast: boolean }) {
  return (
    <div
      data-image-id={image.id}
      style={{
        marginBottom: isLast ? 0 : 'var(--space-8)',
        position: 'relative',
        width: '100%',
      }}
    >
      <FadeInImage
        src={image.url}
        alt={alt}
        width={image.width}
        height={image.height}
        style={{
          width: '100%',
          height: 'auto',
          borderRadius: '4px',
        }}
      />
    </div>
  );
}

// 모달 컴포넌트
function WorkModal({
  workId,
  onClose,
  onWorkClick,
  renderCaption,
}: {
  workId: string;
  onClose: () => void;
  onWorkClick: (workId: string) => void;
  renderCaption: (caption: string | undefined, captionId: string, isModal?: boolean) => React.ReactNode;
}) {
  const [modalWork, setModalWork] = useState<Work | null>(null);
  const [modalCurrentImageId, setModalCurrentImageId] = useState<string | null>(null);
  const modalImageScrollContainerRef = useRef<HTMLDivElement>(null);

  // 모달 열릴 때 배경 스크롤 방지
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // 모달 작업 데이터 로드
  useEffect(() => {
    const loadModalWork = async () => {
      const work = await getWorkById(workId);
      setModalWork(work);
      if (work && work.images.length > 0) {
        const firstImage = work.images.sort((a, b) => a.order - b.order)[0];
        setModalCurrentImageId(firstImage.id);
      }
      // 스크롤 초기화 (다른 작품으로 이동 시)
      if (modalImageScrollContainerRef.current) {
        modalImageScrollContainerRef.current.scrollTop = 0;
      }
    };
    loadModalWork();
  }, [workId]);

  // 모달 내 이미지 Intersection Observer + 스크롤 끝 감지
  useEffect(() => {
    if (!modalWork || !modalCurrentImageId || !modalImageScrollContainerRef.current) return;

    const container = modalImageScrollContainerRef.current;
    const imageElements = container.querySelectorAll('[data-image-id]');
    const sortedImages = modalWork.images.sort((a, b) => a.order - b.order);
    let lastTrackedImageId: string | null = null;

    // 스크롤 끝 감지 및 이미지 위치 기반 활성화
    const updateCurrentImage = () => {
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 30; // 30px 여유

      // 맨 끝에 도달하면 마지막 이미지 활성화
      if (isAtBottom && sortedImages.length > 0) {
        const lastImage = sortedImages[sortedImages.length - 1];
        if (lastImage.id !== lastTrackedImageId) {
          lastTrackedImageId = lastImage.id;
          setModalCurrentImageId(lastImage.id);
        }
        return;
      }

      // 화면 중앙에 가장 가까운 이미지 찾기
      const allImages = Array.from(container.querySelectorAll('[data-image-id]')) as HTMLElement[];
      let bestImage: HTMLElement | null = null;
      let bestScore = -Infinity;
      const containerRect = container.getBoundingClientRect();
      const containerCenter = containerRect.top + containerRect.height / 2;

      allImages.forEach((img) => {
        const rect = img.getBoundingClientRect();
        const imageCenter = rect.top + rect.height / 2;

        // 컨테이너 내에 보이는지 확인
        const isVisible = rect.bottom > containerRect.top && rect.top < containerRect.bottom;

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
          setModalCurrentImageId(imageId);
        }
      }
    };

    const observer = new IntersectionObserver(
      () => {
        updateCurrentImage();
      },
      {
        root: modalImageScrollContainerRef.current,
        rootMargin: '-20% 0px -60% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    imageElements.forEach((el) => observer.observe(el));

    // 스크롤 이벤트로도 체크 (맨 끝 도달 감지용)
    const handleScroll = () => {
      updateCurrentImage();
    };
    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      imageElements.forEach((el) => observer.unobserve(el));
      container.removeEventListener('scroll', handleScroll);
    };
  }, [modalWork, modalCurrentImageId]);

  // 모달 내 링크 클릭 이벤트 처리
  useEffect(() => {
    if (!modalWork) return;

    const handleLinkClick = (e: Event) => {
      e.preventDefault();
      const target = e.target as HTMLElement;
      const link = target.closest('a[data-work-id]') as HTMLElement;
      if (link) {
        const clickedWorkId = link.getAttribute('data-work-id');
        if (clickedWorkId) {
          onWorkClick(clickedWorkId);
        }
      }
    };

    const captionContainers = document.querySelectorAll('[data-is-modal="true"]');
    const links: HTMLElement[] = [];
    captionContainers.forEach((container) => {
      const containerLinks = container.querySelectorAll('a[data-work-id]');
      containerLinks.forEach((link) => {
        links.push(link as HTMLElement);
        link.addEventListener('click', handleLinkClick);
      });
    });

    return () => {
      links.forEach((link) => {
        link.removeEventListener('click', handleLinkClick);
      });
    };
  }, [modalWork, onWorkClick]);

  if (!modalWork) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ color: 'white' }}>로딩 중...</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-6)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="modal-overlay"
    >
      <motion.div
        initial={{ opacity: 0.8, scale: 0.4 }}
        animate={{
          opacity: 1,
          scale: 1,
          transition: {
            duration: 0.3,
            ease: [0.25, 0.1, 0.25, 1],
          }
        }}
        exit={{
          opacity: 0,
          scale: 0.95,
          transition: {
            duration: 0.2,
            ease: [0.4, 0, 0.2, 1],
          }
        }}
        style={{
          backgroundColor: 'var(--color-gray-200)',
          borderRadius: '8px',
          maxWidth: '1200px',
          maxHeight: '90vh',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.04)',
        }}
        onClick={(e) => e.stopPropagation()}
        className="modal-content"
      >
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 'var(--space-4)',
            right: 'var(--space-4)',
            zIndex: 1001,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '24px',
            color: 'var(--color-text-primary)',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
            transition: 'background-color 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-gray-100)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          ×
        </button>

        {/* 상단: 작품명 */}
        <div
          style={{
            padding: 'var(--space-6)',
            paddingBottom: 'var(--space-4)',
          }}
        >
          <h2
            style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--color-text-primary)',
              margin: 0,
              textAlign: 'center',
            }}
          >
            {`「'${modalWork.title}'」`}
            {modalWork.year && (
              <span
                style={{
                  fontWeight: 'var(--font-weight-normal)',
                  color: 'var(--color-text-secondary)',
                  marginLeft: '8px',
                }}
              >
                {modalWork.year}
              </span>
            )}
          </h2>
        </div>

        {/* 본문: 스크롤 영역 + 고정 캡션 */}
        <div
          style={{
            display: 'flex',
            flex: 1,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* 좌측: 타임라인 + 미디어 영역 */}
          <div
            style={{
              width: '65%',
              display: 'flex',
              position: 'relative',
            }}
          >
            {/* 타임라인 UI - 미디어가 2개 이상일 때만 표시 */}
            {(() => {
              const modalMediaItems = getMediaItems(modalWork);
              if (modalMediaItems.length <= 1) return null;

              return (
                <div
                  style={{
                    position: 'sticky',
                    top: 'var(--space-6)',
                    height: 'fit-content',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    paddingLeft: 'var(--space-4)',
                    paddingRight: 'var(--space-2)',
                    zIndex: 10,
                  }}
                >
                  {(() => {
                    const activeIndex = modalMediaItems.findIndex(item => item.data.id === modalCurrentImageId);

                    return modalMediaItems.map((item, index) => {
                      const isActive = modalCurrentImageId === item.data.id;
                      const isLast = index === modalMediaItems.length - 1;

                      const getLineHeight = () => {
                        if (index === activeIndex) return '80px';
                        else if (index === activeIndex - 1) return '50px';
                        else return '25px';
                      };

                      return (
                        <div key={item.data.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <button
                            onClick={() => {
                              const element = modalImageScrollContainerRef.current?.querySelector(`[data-image-id="${item.data.id}"]`);
                              if (element) {
                                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }
                            }}
                            style={{
                              width: isActive ? '8px' : '5px',
                              height: isActive ? '8px' : '5px',
                              borderRadius: '50%',
                              backgroundColor: isActive ? 'var(--color-text-primary)' : 'var(--color-gray-400)',
                              border: 'none',
                              cursor: 'pointer',
                              transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                              padding: 0,
                            }}
                            aria-label={`미디어 ${index + 1}로 이동`}
                          />
                          {!isLast && (
                            <div
                              style={{
                                width: '1px',
                                height: getLineHeight(),
                                backgroundImage: 'linear-gradient(var(--color-gray-300) 50%, transparent 50%)',
                                backgroundSize: '1px 5px',
                                backgroundRepeat: 'repeat-y',
                                margin: '5px 0',
                                transition: 'height 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                              }}
                            />
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              );
            })()}

            {/* 미디어 스크롤 영역 (이미지 + 영상) */}
            <div
              ref={modalImageScrollContainerRef}
              className="image-scroll-container"
              style={{
                flex: 1,
                height: 'calc(90vh - 100px)',
                overflowY: 'auto',
                padding: 'var(--space-6)',
                paddingLeft: modalWork.images.length > 1 ? 'var(--space-2)' : 'var(--space-6)',
                scrollbarWidth: 'none',
                scrollbarColor: 'transparent transparent',
              }}
            >
              {(() => {
                const mediaItems = getMediaItems(modalWork);
                return mediaItems.map((item, index) => {
                  const isLast = index === mediaItems.length - 1;

                  // 영상인 경우
                  if (item.type === 'video') {
                    return (
                      <YouTubeEmbed
                        key={item.data.id}
                        video={item.data}
                        isLast={isLast}
                      />
                    );
                  }

                  // 이미지인 경우
                  return (
                    <ModalImage
                      key={item.data.id}
                      image={item.data}
                      alt={modalWork.title}
                      isLast={isLast}
                    />
                  );
                });
              })()}
            </div>
          </div>

          {/* 우측: 캡션 (고정, 정중앙) */}
          <div
            style={{
              width: '35%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'var(--space-6)',
              position: 'sticky',
              top: 0,
              alignSelf: 'flex-start',
              height: 'calc(90vh - 100px)',
            }}
            onWheel={(e) => {
              // 캡션 영역에서 스크롤 시 이미지 영역으로 전달
              if (modalImageScrollContainerRef.current) {
                modalImageScrollContainerRef.current.scrollTop += e.deltaY;
              }
            }}
          >
            {modalWork.caption && (
              <div
                className="work-caption"
                data-is-modal="true"
                style={{
                  maxWidth: '280px',
                }}
              >
                {renderCaption(modalWork.caption, `modal-${modalWork.id}`, true)}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
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

  const [work, setWork] = useState<Work | null>(null);
  const [relatedWorks, setRelatedWorks] = useState<Work[]>([]);
  const [sentenceCategories, setSentenceCategories] = useState<SentenceCategoryType[]>([]);
  const [exhibitionCategories, setExhibitionCategories] = useState<ExhibitionCategory[]>([]);
  const [selectedKeywordId, setSelectedKeywordId] = useState<string | null>(null);
  const [selectedExhibitionCategoryId, setSelectedExhibitionCategoryId] = useState<string | null>(null);
  const [currentImageId, setCurrentImageId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWorkId, setSelectedWorkId] = useState<string | null>(workId);
  const [hoveredWorkId, setHoveredWorkId] = useState<string | null>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const imageScrollContainerRef = useRef<HTMLDivElement>(null);
  const [modalWorkId, setModalWorkId] = useState<string | null>(null);
  const hoverPositionRef = useRef({ x: 0, y: 0 });
  const observerRef = useRef<MutationObserver | null>(null);
  const hoverLinkTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const linkLeaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hoveredWorkIdRef = useRef<string | null>(null);

  // hoverPosition이 변경될 때마다 ref 업데이트
  useEffect(() => {
    hoverPositionRef.current = hoverPosition;
  }, [hoverPosition]);

  // hoveredWorkId가 변경될 때마다 ref 업데이트
  useEffect(() => {
    hoveredWorkIdRef.current = hoveredWorkId;
  }, [hoveredWorkId]);

  // 위키피디아 스타일: 스크롤 시 Floating Window 숨김
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
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInSafeZoneRef = useRef<boolean>(true);

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

        if (mouseX >= rect.left - SAFE_MARGIN && mouseX <= rect.right + SAFE_MARGIN &&
            mouseY >= rect.top - SAFE_MARGIN && mouseY <= rect.bottom + SAFE_MARGIN) {
          return true;
        }
      }

      // FloatingWindow 영역 체크
      const floatingWindow = document.querySelector('[data-floating-window="true"]');
      if (floatingWindow) {
        const rect = floatingWindow.getBoundingClientRect();
        if (mouseX >= rect.left - SAFE_MARGIN && mouseX <= rect.right + SAFE_MARGIN &&
            mouseY >= rect.top - SAFE_MARGIN && mouseY <= rect.bottom + SAFE_MARGIN) {
          return true;
        }

        // 링크와 FloatingWindow 사이 연결 영역 (세로)
        if (mouseY >= linkBottom - SAFE_MARGIN && mouseY <= rect.top + SAFE_MARGIN &&
            mouseX >= Math.min(linkLeft, rect.left) - SAFE_MARGIN &&
            mouseX <= Math.max(linkRight, rect.right) + SAFE_MARGIN) {
          return true;
        }
      } else if (linkBottom > 0) {
        // FloatingWindow 로딩 중일 때 링크 아래 영역 허용
        if (mouseY >= linkBottom - SAFE_MARGIN && mouseY <= linkBottom + 180 &&
            mouseX >= linkLeft - 100 && mouseX <= linkRight + 100) {
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
        // 안전 영역에서 처음 벗어날 때만 타이머 시작
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

  // 초기 데이터 로드 (카테고리 목록만 - 최초 1회)
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const [workData, sentences, exhibitions] = await Promise.all([
          getWorkById(workId),
          getSentenceCategories(),
          getExhibitionCategories(),
        ]);

        if (!workData) {
          router.push('/');
          return;
        }

        setWork(workData);
        setSentenceCategories(sentences);
        setExhibitionCategories(exhibitions);
        setSelectedWorkId(workId);

        // URL에서 전달받은 카테고리가 있으면 그것을 사용, 없으면 작품의 첫 번째 카테고리 사용
        if (urlKeywordId) {
          // URL에서 키워드 카테고리 전달받음
          const allWorks = await getWorksByKeywordId(urlKeywordId);
          setRelatedWorks(allWorks);
          setSelectedKeywordId(urlKeywordId);
          setSelectedExhibitionCategoryId(null);
        } else if (urlExhibitionId) {
          // URL에서 전시명 카테고리 전달받음
          const allWorks = await getWorksByExhibitionCategoryId(urlExhibitionId);
          setRelatedWorks(allWorks);
          setSelectedExhibitionCategoryId(urlExhibitionId);
          setSelectedKeywordId(null);
        } else if (workData.sentenceCategoryIds.length > 0) {
          // URL 파라미터 없으면 작품의 첫 번째 카테고리 사용
          const keywordId = workData.sentenceCategoryIds[0];
          const allWorks = await getWorksByKeywordId(keywordId);
          setRelatedWorks(allWorks);
          setSelectedKeywordId(keywordId);
          setSelectedExhibitionCategoryId(null);
        } else if (workData.exhibitionCategoryIds.length > 0) {
          const categoryId = workData.exhibitionCategoryIds[0];
          const allWorks = await getWorksByExhibitionCategoryId(categoryId);
          setRelatedWorks(allWorks);
          setSelectedExhibitionCategoryId(categoryId);
          setSelectedKeywordId(null);
        }

        // 첫 번째 이미지 ID 설정
        if (workData.images.length > 0) {
          const firstImage = workData.images.sort((a, b) => a.order - b.order)[0];
          setCurrentImageId(firstImage.id);
        }
      } catch (error) {
        console.error('데이터 로드 실패:', error);
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Intersection Observer로 현재 보이는 이미지 감지
  useEffect(() => {
    if (!selectedWorkId) return;

    // relatedWorks에서 선택된 작업 찾기
    const selectedWork = relatedWorks.find((w) => w.id === selectedWorkId)
      || (selectedWorkId === workId ? work : null);

    if (!selectedWork) return;

    if (selectedWork.images && selectedWork.images.length > 0) {
      const firstImage = selectedWork.images.sort((a, b) => a.order - b.order)[0];
      setCurrentImageId(firstImage.id);
    }

    // 약간의 딜레이 후 observer 설정 (DOM 렌더링 완료 대기)
    const timeoutId = setTimeout(() => {
      const imageElements = document.querySelectorAll('[data-image-id]');
      let lastTrackedImageId: string | null = null;

      const updateCurrentImage = () => {
        // 모든 관찰 대상의 현재 상태를 확인
        const allImages = Array.from(document.querySelectorAll('[data-image-id]'));

        // 스크롤이 맨 끝에 도달했는지 확인
        const scrollTop = window.scrollY;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const isAtBottom = scrollTop + windowHeight >= documentHeight - 50; // 50px 여유

        // 맨 끝에 도달하면 마지막 이미지 활성화
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

          // 이미지 중심점
          const imageCenter = rect.top + rect.height / 2;

          // 화면에 보이는지 확인
          const isVisible = rect.bottom > 0 && rect.top < viewportHeight;

          if (isVisible) {
            // 화면 중앙에 가까울수록 높은 점수 (거리의 역수)
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
          // 깜빡임 방지: 이전과 같은 이미지면 업데이트 안 함
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

      // 스크롤 이벤트로도 체크 (맨 끝 도달 감지용)
      const handleScroll = () => {
        updateCurrentImage();
      };
      window.addEventListener('scroll', handleScroll, { passive: true });

      // cleanup 함수에서 사용할 수 있도록 저장
      (window as Window & { __imageObserver?: IntersectionObserver; __scrollHandler?: () => void }).__imageObserver = observer;
      (window as Window & { __imageObserver?: IntersectionObserver; __scrollHandler?: () => void }).__scrollHandler = handleScroll;
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      const windowWithHandlers = window as Window & { __imageObserver?: IntersectionObserver; __scrollHandler?: () => void };
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

    const eventHandlers = new Map<HTMLElement, { enter: (e: Event) => void; leave: () => void; move: (e: Event) => void; click: (e: Event) => void }>();

    const handleLinkMouseEnter = (e: Event) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[data-work-id]') as HTMLElement;
      if (link) {
        const linkWorkId = link.getAttribute('data-work-id');
        if (linkWorkId) {
          // 모든 관련 타이머 정리
          if (hoverLinkTimeoutRef.current) {
            clearTimeout(hoverLinkTimeoutRef.current);
            hoverLinkTimeoutRef.current = null;
          }
          if (linkLeaveTimeoutRef.current) {
            clearTimeout(linkLeaveTimeoutRef.current);
            linkLeaveTimeoutRef.current = null;
          }
          if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
          }

          hoverLinkTimeoutRef.current = setTimeout(() => {
            const rect = link.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.bottom;

            // 안전 영역 상태 초기화
            isInSafeZoneRef.current = true;

            setHoverPosition({ x, y });
            setHoveredWorkId(linkWorkId);
            hoverLinkTimeoutRef.current = null;
          }, 400);
        }
      }
    };

    const handleLinkMouseLeave = () => {
      // hover 대기 타이머만 취소 (FloatingWindow 숨김은 mousemove에서 처리)
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
          // 모든 hover 관련 타이머 정리
          if (hoverLinkTimeoutRef.current) {
            clearTimeout(hoverLinkTimeoutRef.current);
            hoverLinkTimeoutRef.current = null;
          }
          if (linkLeaveTimeoutRef.current) {
            clearTimeout(linkLeaveTimeoutRef.current);
            linkLeaveTimeoutRef.current = null;
          }
          // hover 박스 즉시 숨김
          setHoveredWorkId(null);
          hoveredWorkIdRef.current = null;
          // 모달 열기
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div style={{ color: 'var(--color-text-muted)' }}>로딩 중...</div>
      </div>
    );
  }

  if (!work) {
    return null;
  }

  // 현재 선택된 작품의 ID 목록 계산 (disabled 상태 계산용)
  const selectedWorkIds = [work.id, ...relatedWorks.map(w => w.id)];

  // 이미지와 캡션 렌더링
  const renderCaption = (caption: string | undefined, captionId: string, isModal: boolean = false) => {
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
  };

  // 카테고리 선택 핸들러 (상세 페이지에서는 네비게이션 용도)
  const handleKeywordSelect = async (keywordId: string) => {
    const allWorks = await getWorksByKeywordId(keywordId);
    // 모든 작업을 relatedWorks에 저장 (현재 work 제외하지 않음 - Sidebar에서 전체 목록 사용)
    setRelatedWorks(allWorks);
    setSelectedKeywordId(keywordId);
    setSelectedExhibitionCategoryId(null);
    // 첫 번째 작업 선택
    if (allWorks.length > 0) {
      setSelectedWorkId(allWorks[0].id);
    }
  };

  const handleExhibitionCategorySelect = async (categoryId: string) => {
    const allWorks = await getWorksByExhibitionCategoryId(categoryId);
    // 모든 작업을 relatedWorks에 저장 (현재 work 제외하지 않음 - Sidebar에서 전체 목록 사용)
    setRelatedWorks(allWorks);
    setSelectedExhibitionCategoryId(categoryId);
    setSelectedKeywordId(null);
    // 첫 번째 작업 선택
    if (allWorks.length > 0) {
      setSelectedWorkId(allWorks[0].id);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 relative" style={{ paddingTop: '60px' }}>
        {/* 좌우 카테고리 영역 - 홈과 동일하게 Sidebar 사용 + 작업 목록 포함 */}
        <Sidebar
          sentenceCategories={sentenceCategories}
          exhibitionCategories={exhibitionCategories}
          selectedKeywordId={selectedKeywordId}
          selectedExhibitionCategoryId={selectedExhibitionCategoryId}
          onKeywordSelect={handleKeywordSelect}
          onExhibitionCategorySelect={handleExhibitionCategorySelect}
          selectedWorkIds={selectedWorkIds}
          works={relatedWorks}
          selectedWorkId={selectedWorkId}
          onWorkSelect={setSelectedWorkId}
        />
        {/* 이미지 컨텐츠 영역 - 좌측 50% */}
        <main
          style={{
            position: 'relative',
            minHeight: 'calc(100vh - 60px)',
            paddingTop: '220px', // 카테고리 영역(64px) + 작품 목록(~100px) + 여백(~56px)과 겹치지 않도록
          }}
        >
          {/* 선택된 작품의 미디어(이미지+영상) 표시 */}
          {selectedWorkId && (() => {
            // relatedWorks에서 선택된 작업 찾기 (카테고리 재선택 시에도 올바르게 동작)
            const selectedWork = relatedWorks.find((w) => w.id === selectedWorkId)
              || (selectedWorkId === workId ? work : null);

            if (!selectedWork || !selectedWork.images || selectedWork.images.length === 0) {
              return null;
            }

            // 이미지와 영상을 통합하여 order 순으로 정렬
            const sortedMedia = getMediaItems(selectedWork);
            // 하위 호환성을 위해 sortedImages도 유지
            const sortedImages = selectedWork.images.sort((a, b) => a.order - b.order);

            return (
              <>
                {/* 좌측 고정 타임라인 UI - 미디어가 2개 이상일 때만 표시 */}
                {sortedMedia.length > 1 && (
                  <div
                    style={{
                      position: 'fixed',
                      left: 'var(--category-margin-left)', // 카테고리, 작업 목록과 동일한 시작점 (48px)
                      top: '50%',
                      transform: 'translateY(-50%)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      zIndex: 50,
                    }}
                  >
                  {(() => {
                    // 현재 활성 미디어의 인덱스 찾기
                    const activeIndex = sortedMedia.findIndex(item => item.data.id === currentImageId);

                    return sortedMedia.map((item, index) => {
                      const isActive = currentImageId === item.data.id;
                      const isLast = index === sortedMedia.length - 1;

                      // 동적 선 길이 계산: 활성 점 아래의 선은 길게, 나머지는 짧게
                      const getLineHeight = () => {
                        if (index === activeIndex) {
                          // 활성 점 아래의 선: 길게
                          return '100px';
                        } else if (index === activeIndex - 1) {
                          // 활성 점 바로 위의 선: 중간
                          return '60px';
                        } else {
                          // 나머지: 짧게
                          return '30px';
                        }
                      };

                      return (
                        <div key={item.data.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          {/* 타임라인 점 */}
                          <button
                            onClick={() => {
                              const element = document.querySelector(`[data-image-id="${item.data.id}"]`);
                              if (element) {
                                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }
                            }}
                            style={{
                              width: isActive ? '10px' : '6px',
                              height: isActive ? '10px' : '6px',
                              borderRadius: '50%',
                              backgroundColor: isActive ? 'var(--color-text-primary)' : 'var(--color-gray-400)',
                              border: 'none',
                              cursor: 'pointer',
                              transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                              padding: 0,
                            }}
                            aria-label={`미디어 ${index + 1}로 이동`}
                          />
                          {/* 타임라인 점선 - 동적 길이 */}
                          {!isLast && (
                            <div
                              style={{
                                width: '1px',
                                height: getLineHeight(),
                                backgroundImage: 'linear-gradient(var(--color-gray-300) 50%, transparent 50%)',
                                backgroundSize: '1px 6px',
                                backgroundRepeat: 'repeat-y',
                                margin: '6px 0',
                                transition: 'height 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                              }}
                            />
                          )}
                        </div>
                      );
                    });
                    })()}
                  </div>
                )}

                {/* 좌측: 미디어 영역 (50%) */}
                <div
                  style={{
                    width: '50%',
                    paddingLeft: 'var(--space-12)', // 타임라인 공간 확보 (80px → 96px)
                    paddingRight: 'var(--space-6)',
                    paddingBottom: 'var(--space-10)',
                    position: 'relative',
                  }}
                >
                  {/* 미디어들 세로 나열 (이미지 + 영상) */}
                  <div
                    ref={imageScrollContainerRef}
                  >
                    {sortedMedia.map((item, index) => {
                      const isLast = index === sortedMedia.length - 1;
                      const isFirst = index === 0;

                      // 영상인 경우
                      if (item.type === 'video') {
                        const video = item.data;
                        return (
                          <div
                            key={video.id}
                            data-image-id={video.id}
                            className="work-media-container"
                            style={{
                              marginBottom: isLast ? 0 : 'var(--space-10)',
                              position: 'relative',
                              width: '100%',
                              scrollSnapAlign: 'start',
                              scrollMarginTop: '280px',
                            }}
                          >
                            <div
                              style={{
                                position: 'relative',
                                width: '100%',
                                paddingBottom: '56.25%', // 16:9 비율
                                backgroundColor: '#000',
                                borderRadius: '4px',
                                overflow: 'hidden',
                              }}
                            >
                              <iframe
                                src={video.embedUrl}
                                title={video.title || 'YouTube 영상'}
                                style={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  width: '100%',
                                  height: '100%',
                                  border: 'none',
                                }}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            </div>
                          </div>
                        );
                      }

                      // 이미지인 경우
                      const image = item.data;
                      return (
                        <div
                          key={image.id}
                          data-image-id={image.id}
                          className="work-image-container"
                          style={{
                            marginBottom: isLast ? 0 : 'var(--space-10)', // 미디어 간 간격 80px
                            position: 'relative',
                            width: '100%',
                            scrollSnapAlign: 'start', // snap 효과
                            scrollMarginTop: '280px', // 상단 여백과 동일하게 설정
                          }}
                        >
                          <FadeInImage
                            src={image.url}
                            alt={selectedWork.title}
                            width={image.width}
                            height={image.height}
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

                {/* 우측: 캡션 - 오른쪽으로 10%, 아래로 10% 이동 */}
                {selectedWork.caption && (
                  <div
                    className="work-caption"
                    style={{
                      position: 'fixed',
                      left: 'calc(50% + var(--space-16) + 5%)', // 기존보다 오른쪽으로 ~10% 이동
                      bottom: 'calc(var(--space-16) - 5vh)', // 기존보다 아래로 ~10% 이동
                      width: '200px',
                      maxWidth: 'calc(50% - var(--space-12) - 5%)',
                      maxHeight: 'calc(100vh - 200px)', // 상단 여백 확보
                      zIndex: 40,
                    }}
                  >
                    {renderCaption(selectedWork.caption, selectedWork.id)}
                  </div>
                )}
              </>
            );
          })()}
        </main>
      </div>

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

      <AnimatePresence>
        {hoveredWorkId && (
          <motion.div
            key="floating-window-container"
            className="floating-work-window-container"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } }}
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
            <div
              style={{
                pointerEvents: 'auto',
              }}
            >
              <FloatingWorkWindow
                workId={hoveredWorkId}
                position={hoverPosition}
                onClick={(clickedWorkId) => {
                  setHoveredWorkId(null);
                  setModalWorkId(clickedWorkId);
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
