'use client';

/**
 * 작품 상세 모달 컴포넌트
 * 캡션 내 링크 클릭 시 다른 작품 정보를 모달로 표시
 */

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useWork } from '@/domain';
import { getMediaItems } from '@/core/utils';
import { Spinner } from '@/presentation';
import { YouTubeEmbed } from '../media';
import ModalImage from './ModalImage';
import type { Work } from '@/types';

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

  const [modalCurrentImageId, setModalCurrentImageId] = useState<string | null>(null);
  const modalImageScrollContainerRef = useRef<HTMLDivElement>(null);

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
        setModalCurrentImageId(mediaItems[0].data.id);
      }
      // 스크롤 초기화 (다른 작품으로 이동 시)
      if (modalImageScrollContainerRef.current) {
        modalImageScrollContainerRef.current.scrollTop = 0;
      }
    }
  }, [modalWork, workId]);

  // 모달 내 이미지 Intersection Observer + 스크롤 끝 감지
  useEffect(() => {
    if (!modalWork || !modalCurrentImageId || !modalImageScrollContainerRef.current) return;

    const container = modalImageScrollContainerRef.current;
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
            {modalMediaItems.length > 1 && (
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
                  const activeIndex = modalMediaItems.findIndex(
                    (item) => item.data.id === modalCurrentImageId
                  );

                  return modalMediaItems.map((item, index) => {
                    const isActive = modalCurrentImageId === item.data.id;
                    const isLast = index === modalMediaItems.length - 1;

                    const getLineHeight = () => {
                      if (index === activeIndex) return '80px';
                      else if (index === activeIndex - 1) return '50px';
                      else return '25px';
                    };

                    return (
                      <div
                        key={item.data.id}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                      >
                        <button
                          onClick={() => {
                            const element = modalImageScrollContainerRef.current?.querySelector(
                              `[data-image-id="${item.data.id}"]`
                            );
                            if (element) {
                              element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                          }}
                          style={{
                            width: isActive ? '8px' : '5px',
                            height: isActive ? '8px' : '5px',
                            borderRadius: '50%',
                            backgroundColor: isActive
                              ? 'var(--color-text-primary)'
                              : 'var(--color-gray-400)',
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
                              backgroundImage:
                                'linear-gradient(var(--color-gray-300) 50%, transparent 50%)',
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
            )}

            {/* 미디어 스크롤 영역 (이미지 + 영상) */}
            <div
              ref={modalImageScrollContainerRef}
              className="image-scroll-container"
              style={{
                flex: 1,
                height: 'calc(90vh - 100px)',
                overflowY: 'auto',
                padding: 'var(--space-6)',
                paddingLeft: modalMediaItems.length > 1 ? 'var(--space-2)' : 'var(--space-6)',
                scrollbarWidth: 'none',
                scrollbarColor: 'transparent transparent',
              }}
            >
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

