'use client';

/**
 * 작품 상세 모달 컴포넌트
 * 캡션 내 링크 클릭 시 다른 작품 정보를 모달로 표시
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
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import 'overlayscrollbars/overlayscrollbars.css';

interface OverlayScrollbarsInstance {
  elements: () => { viewport: HTMLElement | null };
}

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
  const { data: modalWork, isLoading, isError } = useWork(workId);

  const { hoveredWorkId, hoverPosition, clearHover } = useCaptionHoverEvents({
    containerSelector: '[data-is-modal="true"]',
    hoverDelay: 400,
    hideDelay: 200,
    currentWorkId: modalWork?.id,
    dependencies: [modalWork],
  });

  const { data: hoveredWork } = useWork(hoveredWorkId || '');

  // OverlayScrollbars의 viewport를 imageTracker에 전달하기 위한 ref
  const viewportRef = useRef<HTMLElement | null>(null);
  const overlayScrollbarsRef = useRef<OverlayScrollbarsInstance | null>(null);

  // 현재 표시 중인 미디어 추적
  const { currentImageId: modalCurrentImageId } = useImageTracker(
    viewportRef,
    modalWork,
    workId
  );

  // 모달 캡션 내 작품 링크 클릭 처리
  useModalLinkHandler(onWorkClick, clearHover);

  // workId 변경 시 hover 상태 초기화
  useEffect(() => {
    clearHover();
  }, [workId, clearHover]);

  // 모달 언마운트 시 body scroll lock 해제
  useEffect(() => {
    return () => {
      if (viewportRef.current) {
        enableBodyScroll(viewportRef.current);
      }
      clearAllBodyScrollLocks();
    };
  }, []);

  // workId 변경 시 스크롤 초기화 (다른 작품으로 이동 시)
  useEffect(() => {
    if (modalWork && viewportRef.current) {
      viewportRef.current.scrollTop = 0;
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
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      onWheel={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      onTouchMove={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault();
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
          maxWidth: '1200px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'visible',
          border: 'none',
          paddingBottom: '40px',
          overscrollBehavior: 'contain',
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
            {`${modalWork.title}${modalWork.year ? `,\u00A0${modalWork.year}` : ''}`}
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
            overscrollBehavior: 'contain',
          }}
          onWheel={(e) => {
            e.stopPropagation();
            if (viewportRef.current) {
              e.preventDefault();
              viewportRef.current.scrollTop += e.deltaY;
            }
          }}
        >
          {/* 좌측: 미디어 스크롤 영역 */}
          <div style={{ width: '65%', position: 'relative', overscrollBehavior: 'contain' }}>
            <OverlayScrollbarsComponent
              element="div"
              className="os-theme-dotted-left"
              options={{
                scrollbars: { autoHide: 'never', autoHideDelay: 0 },
                overflow: { x: 'hidden', y: 'scroll' },
              }}
              events={{
                initialized: (instance) => {
                  overlayScrollbarsRef.current = instance;
                  const { viewport } = instance.elements();
                  viewportRef.current = viewport;
                  if (viewport) {
                    disableBodyScroll(viewport, {
                      reserveScrollBarGap: true,
                      allowTouchMove: (el) => {
                        while (el && el !== document.body) {
                          if (el === viewport) return true;
                          const parent = el.parentElement;
                          if (!parent) break;
                          el = parent;
                        }
                        return false;
                      },
                    });
                  }
                },
              }}
              style={{
                height: 'calc(70vh - 80px)',
                overscrollBehavior: 'contain',
                touchAction: 'pan-y',
              }}
            >
              <div style={{
                paddingRight: 'var(--space-6)',
                paddingLeft: 'calc(var(--space-4) + 20px + var(--space-4))',
              }}>
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
              overscrollBehavior: 'contain',
            }}
          >
            {modalWork.caption && (
              <div className="work-caption" data-is-modal="true">
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
