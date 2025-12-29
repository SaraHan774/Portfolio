'use client';

/**
 * 작품 상세 모달 컴포넌트
 * 캡션 내 링크 클릭 시 다른 작품 정보를 모달로 표시
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWork, useCaptionHoverEvents } from '@/domain';
import { getMediaItems } from '@/core/utils';
import { Spinner } from '@/presentation';
import { YouTubeEmbed } from '../media';
import ModalImage from './ModalImage';
import FloatingWorkWindow from './FloatingWorkWindow';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import 'overlayscrollbars/overlayscrollbars.css';

interface WorkModalProps {
  /** 표시할 작품 ID */
  workId: string;
  /** 모달 닫기 핸들러 */
  onClose: () => void;
  /** 다른 작품 클릭 핸들러 */
  onWorkClick: (workId: string) => void;
  /** 캡션 렌더링 함수 */
  renderCaption: (
    caption: string | undefined,
    captionId: string,
    isModal?: boolean
  ) => React.ReactNode;
}

export default function WorkModal({
  workId,
  onClose,
  onWorkClick,
  renderCaption,
}: WorkModalProps) {
  // Fetch work data using domain hook
  const { data: modalWork } = useWork(workId);

  // Caption hover events 설정
  const { hoveredWorkId, hoverPosition, clearHover } = useCaptionHoverEvents({
    containerSelector: '[data-is-modal="true"]',
    hoverDelay: 400,
    hideDelay: 200,
    currentWorkId: modalWork?.id,
    dependencies: [modalWork],
  });

  // Hover 중인 작업 데이터
  const { data: hoveredWork } = useWork(hoveredWorkId || '');

  interface OverlayScrollbarsInstance {
    elements: () => {
      viewport: HTMLElement | null;
    };
  }

  const [modalCurrentImageId, setModalCurrentImageId] = useState<string | null>(null);
  const overlayScrollbarsRef = useRef<OverlayScrollbarsInstance | null>(null);

  // 모달 작품이 변경될 때 hover 상태 초기화
  useEffect(() => {
    clearHover();
  }, [workId, clearHover]);

  // 모달 열릴 때 배경 스크롤 방지
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // 첫 번째 미디어 ID 설정 및 스크롤 초기화
  useEffect(() => {
    if (modalWork) {
      const mediaItems = getMediaItems(modalWork);
      if (mediaItems.length > 0) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setModalCurrentImageId(mediaItems[0].data.id);
      }
      // 스크롤 초기화 (다른 작품으로 이동 시)
      if (overlayScrollbarsRef.current) {
        const { viewport } = overlayScrollbarsRef.current.elements();
        if (viewport) {
          viewport.scrollTop = 0;
        }
      }
    }
  }, [modalWork, workId]);

  // 모달 내 이미지 Intersection Observer + 스크롤 끝 감지
  useEffect(() => {
    if (!modalWork || !modalCurrentImageId || !overlayScrollbarsRef.current) return;

    const { viewport } = overlayScrollbarsRef.current.elements();
    if (!viewport) return;

    const container = viewport as HTMLElement;
    const imageElements = container.querySelectorAll('[data-image-id]');
    const sortedMedia = getMediaItems(modalWork);
    let lastTrackedImageId: string | null = null;

    // 스크롤 끝 감지 및 미디어 위치 기반 활성화
    const updateCurrentImage = () => {
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 30; // 30px 여유

      // 맨 끝에 도달하면 마지막 미디어 활성화
      if (isAtBottom && sortedMedia.length > 0) {
        const lastMedia = sortedMedia[sortedMedia.length - 1];
        if (lastMedia.data.id !== lastTrackedImageId) {
          lastTrackedImageId = lastMedia.data.id;
          setModalCurrentImageId(lastMedia.data.id);
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
        root: container,
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

  // 모달 내 링크 클릭 이벤트 처리 (이벤트 위임)
  useEffect(() => {
    const handleLinkClick = (e: Event) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[data-work-id]') as HTMLElement;

      // 모달 내부 캡션의 링크만 처리
      const modalCaptionContainer = link?.closest('[data-is-modal="true"]');
      if (link && modalCaptionContainer) {
        e.preventDefault();
        const clickedWorkId = link.getAttribute('data-work-id');
        if (clickedWorkId) {
          clearHover(); // Hover 상태 초기화
          onWorkClick(clickedWorkId);
        }
      }
    };

    // document.body에 이벤트 위임으로 부착 (동적 링크 포함)
    document.body.addEventListener('click', handleLinkClick);

    return () => {
      document.body.removeEventListener('click', handleLinkClick);
    };
  }, [onWorkClick, clearHover]);

  // 로딩 상태
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
        <Spinner size={24} color="white" />
      </div>
    );
  }

  const modalMediaItems = getMediaItems(modalWork);

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
        backgroundColor: 'transparent',
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
          },
        }}
        exit={{
          opacity: 0,
          scale: 0.95,
          transition: {
            duration: 0.2,
            ease: [0.4, 0, 0.2, 1],
          },
        }}
        style={{
          maxWidth: '1200px',
          maxHeight: '70vh',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'visible',
          border: 'none',
        }}
        onClick={(e) => e.stopPropagation()}
        className="modal-content"
      >
        {/* Soft edge blur background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(230, 230, 230)',
            filter: 'blur(3px)',
            zIndex: 0,
          }}
        />

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
            position: 'relative',
            padding: 'var(--space-6)',
            paddingBottom: 'var(--space-4)',
            zIndex: 1,
          }}
        >
          <h2
            style={{
              fontSize: 'var(--font-size-lg)',
              color: 'var(--color-text-primary)',
              margin: 0,
              textAlign: 'center',
            }}
          >
              {`「‘${modalWork.title}’」${modalWork.year ? `,\u00A0${modalWork.year}` : ''}`}
          </h2>
        </div>

        {/* 본문: 스크롤 영역 + 고정 캡션 */}
        <div
          style={{
            display: 'flex',
            flex: 1,
            overflow: 'hidden',
            position: 'relative',
            zIndex: 1,
            borderRadius: '0 0 4px 4px',
          }}
        >
          {/* 좌측: 타임라인 + 미디어 영역 */}
          <div
            style={{
              width: '65%',
              position: 'relative',
            }}
          >
            {/* 미디어 스크롤 영역 (이미지 + 영상) */}
            <OverlayScrollbarsComponent
              element="div"
              className="os-theme-dotted-left"
              options={{
                scrollbars: {
                  autoHide: 'never',
                  autoHideDelay: 0,
                },
                overflow: {
                  x: 'hidden',
                  y: 'scroll',
                },
              }}
              events={{
                initialized: (instance) => {
                  overlayScrollbarsRef.current = instance;
                  console.log('OverlayScrollbars initialized:', instance);
                },
              }}
              style={{
                height: 'calc(70vh - 80px)',
              }}
            >
              <div style={{
                // paddingTop: 'var(--space-6)',
                paddingRight: 'var(--space-6)',
                // paddingBottom: 'var(--space-6)',
                paddingLeft: 'calc(var(--space-4) + 20px + var(--space-4))',
              }}>
              {modalMediaItems.map((item, index) => {
                const isLast = index === modalMediaItems.length - 1;

                // 영상인 경우
                if (item.type === 'video') {
                  return <YouTubeEmbed key={item.data.id} video={item.data} isLast={isLast} />;
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
              })}
              </div>
            </OverlayScrollbarsComponent>
          </div>

          {/* 우측: 캡션 (고정, 정중앙) */}
          <div
            style={{
              width: '35%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'var(--space-6)',
              paddingRight: 'calc(var(--space-6) + var(--space-8))',
              position: 'sticky',
              top: 0,
              alignSelf: 'flex-start',
              height: 'calc(70vh - 100px)',
            }}
            onWheel={(e) => {
              // 캡션 영역에서 스크롤 시 이미지 영역으로 전달
              if (overlayScrollbarsRef.current) {
                const { viewport } = overlayScrollbarsRef.current.elements();
                if (viewport) {
                  viewport.scrollTop += e.deltaY;
                }
              }
            }}
          >
            {modalWork.caption && (
              <div
                className="work-caption"
                data-is-modal="true"
              >
                {renderCaption(modalWork.caption, `modal-${modalWork.id}`, true)}
              </div>
            )}
          </div>
        </div>

        {/* FloatingWorkWindow - Caption hover */}
        <AnimatePresence>
          {hoveredWork && hoverPosition && (
            <div data-floating-window="true" style={{ zIndex: 1100, position: 'absolute' }}>
              <FloatingWorkWindow
                work={hoveredWork}
                position={hoverPosition}
                onClick={(clickedWorkId) => {
                  onWorkClick(clickedWorkId);
                  clearHover();
                }}
              />
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

