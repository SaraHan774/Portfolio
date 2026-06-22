'use client';

/**
 * 작품 상세 모달 컴포넌트 (모바일 버전)
 * 캡션 내 링크 클릭 시 다른 작품 정보를 모달로 표시
 * 모바일에서는 작품명 - 작품 리스트 - 캡션 순으로 세로 배치
 */

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { disableBodyScroll, enableBodyScroll, clearAllBodyScrollLocks } from 'body-scroll-lock';
import { useWork, useCaptionHoverEvents, useModalLinkHandler, useImageTracker } from '@/domain';
import { getMediaItems } from '@/core/utils';
import { Spinner } from '@/presentation';
import { YouTubeEmbed } from '../media';
import ModalImage from './ModalImage';
import FloatingWorkWindow from './FloatingWorkWindow';

interface WorkModalMobileProps {
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

export default function WorkModalMobile({
  workId,
  onClose,
  onWorkClick,
  renderCaption,
}: WorkModalMobileProps) {
  const { data: modalWork, isLoading, isError } = useWork(workId);

  const { hoveredWorkId, hoverPosition, clearHover } = useCaptionHoverEvents({
    containerSelector: '[data-is-modal="true"]',
    hoverDelay: 400,
    hideDelay: 200,
    currentWorkId: modalWork?.id,
    dependencies: [modalWork],
  });

  const { data: hoveredWork } = useWork(hoveredWorkId || '');

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const touchStartY = useRef<number>(0);

  // 현재 표시 중인 미디어 추적
  const { currentImageId: modalCurrentImageId } = useImageTracker(
    scrollContainerRef as React.RefObject<HTMLElement | null>,
    modalWork,
    workId
  );

  // 모달 캡션 내 작품 링크 클릭 처리
  useModalLinkHandler(onWorkClick, clearHover);

  // workId 변경 시 hover 상태 초기화
  useEffect(() => {
    clearHover();
  }, [workId, clearHover]);

  // 모달 열릴 때 배경 스크롤 방지 (iOS Safari 대응)
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;

    if (scrollContainer) {
      disableBodyScroll(scrollContainer, {
        reserveScrollBarGap: true,
        allowTouchMove: (el) => {
          while (el && el !== document.body) {
            if (el === scrollContainer) return true;
            const parent = el.parentElement;
            if (!parent) break;
            el = parent;
          }
          return false;
        },
      });
    }

    return () => {
      if (scrollContainer) {
        enableBodyScroll(scrollContainer);
      }
      clearAllBodyScrollLocks();
    };
  }, []);

  // workId 변경 시 스크롤 초기화
  useEffect(() => {
    if (modalWork && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [modalWork, workId]);

  // 에러 시 자동으로 모달 닫기
  useEffect(() => {
    if (isError) {
      onClose();
    }
  }, [isError, onClose]);

  if (isLoading || !modalWork) {
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
    <>
      <style>{`
        .mobile-modal-scroll::-webkit-scrollbar {
          display: none;
        }
      `}</style>
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
          padding: 'var(--space-4)',
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
        onWheel={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onTouchMove={(e) => {
          if (e.target === e.currentTarget) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        className="modal-overlay"
      >
        <motion.div
          initial={{ opacity: 0.8, scale: 0.4 }}
          animate={{
            opacity: 1,
            scale: 1,
            transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
          }}
          exit={{
            opacity: 0,
            scale: 0.95,
            transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
          }}
          style={{
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            overflow: 'hidden',
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
              background: 'rgba(240,240,240,0.97)',
              filter: 'blur(10px)',
              zIndex: 0,
            }}
          />

          {/* 전체 스크롤 영역 */}
          <div
            ref={scrollContainerRef}
            className="mobile-modal-scroll"
            style={{
              height: '100%',
              position: 'relative',
              zIndex: 1,
              overflowX: 'hidden',
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            } as React.CSSProperties}
            onTouchStart={(e) => {
              touchStartY.current = e.touches[0].clientY;
            }}
            onTouchMove={(e) => {
              const container = scrollContainerRef.current;
              if (!container) return;

              const scrollTop = container.scrollTop;
              const scrollHeight = container.scrollHeight;
              const clientHeight = container.clientHeight;
              const touchY = e.touches[0].clientY;
              const deltaY = touchStartY.current - touchY;

              const isAtTop = scrollTop <= 0 && deltaY < 0;
              const isAtBottom = scrollTop + clientHeight >= scrollHeight && deltaY > 0;

              if (isAtTop || isAtBottom) {
                e.preventDefault();
              }
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                padding: 'var(--space-2)',
                gap: 'var(--space-3)',
                position: 'relative',
              }}
            >
              {/* 닫기 버튼 */}
              <button
                onClick={onClose}
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
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
                  zIndex: 10,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-gray-100)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                ×
              </button>

              {/* 1. 작품명 */}
              <div>
                <h2
                  style={{
                    fontSize: 'var(--font-size-lg)',
                    color: 'var(--color-text-primary)',
                    margin: 0,
                    textAlign: 'center',
                  }}
                >
                  {`${modalWork.title}${modalWork.year ? `,\u00A0${modalWork.year}` : ''}`}
                </h2>
              </div>

              {/* 2. 작품 리스트 (미디어) */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {modalMediaItems.map((item, index) => {
                  const isLast = index === modalMediaItems.length - 1;
                  if (item.type === 'video') {
                    return <YouTubeEmbed key={item.data.id} video={item.data} isLast={isLast} />;
                  }
                  return (
                    <ModalImage
                      key={item.data.id}
                      image={item.data}
                      alt={modalWork.title}
                      isLast={isLast}
                      marginBottom='var(--space-2)'
                      priority={index === 0}
                    />
                  );
                })}
              </div>

              {/* 3. 캡션 */}
              {modalWork.caption && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    padding: '0 0 var(--space-2) 0',
                  }}
                >
                  <div
                    className="work-caption"
                    data-is-modal="true"
                    style={{ maxWidth: '600px', width: '100%' }}
                  >
                    {renderCaption(modalWork.caption, `modal-${modalWork.id}`, true)}
                  </div>
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
    </>
  );
}
