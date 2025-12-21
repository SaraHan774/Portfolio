'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/app/components/layout/Header';
import Footer from '@/app/components/layout/Footer';
import CategorySidebar from '@/app/components/layout/CategorySidebar';
import WorkListScroller from '@/app/components/work/WorkListScroller';
import Spinner from '@/app/components/common/Spinner';
import { getWorkById, getWorksByKeywordId, getWorksByExhibitionCategoryId } from '@/lib/services/worksService';
import { useCategories } from '@/app/contexts/CategoriesContext';
import FloatingWorkWindow from '@/app/components/work/FloatingWorkWindow';
import type { Work, WorkImage, WorkVideo, MediaItem } from '@/types';

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

// YouTube embed URL에 컨트롤 최소화 파라미터를 추가하는 헬퍼 함수
function getMinimalYouTubeEmbedUrl(embedUrl: string): string {
  try {
    const url = new URL(embedUrl);
    
    // 컨트롤 및 UI 요소 최소화를 위한 파라미터 추가
    url.searchParams.set('controls', '0');           // 컨트롤 숨김
    url.searchParams.set('modestbranding', '1');     // YouTube 로고 최소화
    url.searchParams.set('rel', '0');                // 관련 영상 숨김
    url.searchParams.set('iv_load_policy', '3');     // 주석 숨김
    url.searchParams.set('disablekb', '1');          // 키보드 단축키 비활성화
    url.searchParams.set('fs', '0');                 // 전체화면 버튼 숨김
    url.searchParams.set('cc_load_policy', '0');     // 자막 관련 UI 최소화
    url.searchParams.set('playsinline', '1');        // 모바일에서 인라인 재생
    url.searchParams.set('showinfo', '0');           // 영상 정보 숨김 (deprecated이지만 일부 버튼 숨김에 도움)
    
    return url.toString();
  } catch (error) {
    // URL 파싱 실패 시 원본 URL 반환
    console.error('YouTube embed URL 파싱 실패:', error);
    return embedUrl;
  }
}

// YouTube IFrame Player API 타입 선언
declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        config: {
          videoId: string;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: (event: { target: YTPlayer }) => void;
            onStateChange?: (event: { data: number }) => void;
          };
        }
      ) => YTPlayer;
      PlayerState: {
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  destroy: () => void;
  getPlayerState: () => number;
}

// YouTube IFrame API 로드 (한 번만)
let isYTApiLoaded = false;
let ytApiReadyCallbacks: (() => void)[] = [];

function loadYouTubeAPI(): Promise<void> {
  return new Promise((resolve) => {
    if (isYTApiLoaded && window.YT) {
      resolve();
      return;
    }

    ytApiReadyCallbacks.push(resolve);

    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);

      window.onYouTubeIframeAPIReady = () => {
        isYTApiLoaded = true;
        ytApiReadyCallbacks.forEach((cb) => cb());
        ytApiReadyCallbacks = [];
      };
    }
  });
}

// YouTube 영상 Embed 컴포넌트 - 뷰포트 진입 시 자동재생 (뮤트) + 루프
function YouTubeEmbed({ video, isLast = false }: { video: WorkVideo; isLast?: boolean }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [isApiReady, setIsApiReady] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const playerContainerId = `yt-player-${video.id}`;

  // youtubeVideoId에서 순수 video ID만 추출 (list, index 등 파라미터 제거)
  const pureVideoId = video.youtubeVideoId.split('?')[0].split('&')[0];

  // 원본 비율이 있으면 사용, 없으면 기본 16:9 (56.25%)
  const aspectRatio = video.width && video.height
    ? (video.height / video.width) * 100
    : 56.25;

  // YouTube API 로드
  useEffect(() => {
    loadYouTubeAPI().then(() => setIsApiReady(true));
  }, []);

  // Intersection Observer로 뷰포트 진입 감지
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true);
          }
        });
      },
      {
        threshold: 0.3,
        rootMargin: '50px',
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  // YouTube Player 초기화
  useEffect(() => {
    if (!isVisible || !isApiReady || playerRef.current) return;

    const initPlayer = () => {
      playerRef.current = new window.YT.Player(playerContainerId, {
        videoId: pureVideoId,
        playerVars: {
          autoplay: 1,
          mute: 1,
          loop: 1,
          playlist: pureVideoId, // 루프를 위해 필요 (순수 ID만)
          controls: 0, // 컨트롤 숨김
          modestbranding: 1,
          rel: 0, // 관련 영상 비활성화
          showinfo: 0, // deprecated but still helps
          iv_load_policy: 3, // 주석 숨김
          disablekb: 1, // 키보드 컨트롤 비활성화
          fs: 0, // 전체화면 버튼 숨김
          playsinline: 1,
          origin: typeof window !== 'undefined' ? window.location.origin : '',
        },
        events: {
          onReady: (event) => {
            event.target.mute();
            event.target.playVideo();
          },
          onStateChange: (event) => {
            // 영상 끝나면 다시 재생 (루프 보완)
            if (event.data === window.YT.PlayerState.ENDED) {
              playerRef.current?.playVideo();
            }
          },
        },
      });
    };

    // 약간의 딜레이 후 초기화 (DOM 준비 대기)
    const timer = setTimeout(initPlayer, 100);
    return () => clearTimeout(timer);
  }, [isVisible, isApiReady, pureVideoId, playerContainerId]);

  // 컴포넌트 언마운트 시 플레이어 정리
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, []);

  // 음소거 토글 (플레이어 API 사용 - 영상 리셋 없음)
  const handleMuteToggle = () => {
    if (playerRef.current) {
      if (isMuted) {
        playerRef.current.unMute();
      } else {
        playerRef.current.mute();
      }
      setIsMuted(!isMuted);
    }
  };

  // 재생/일시정지 토글
  const handlePlayPauseToggle = () => {
    if (playerRef.current) {
      if (isPaused) {
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
      }
      setIsPaused(!isPaused);
    }
  };

  // 전체화면 토글
  const handleFullscreenToggle = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error('전체화면 전환 실패:', err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // 전체화면 상태 변경 감지
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div
      ref={containerRef}
      data-image-id={video.id}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        marginBottom: isLast ? 0 : 'var(--space-10)',
        position: 'relative',
        width: '100%',
        paddingBottom: `${aspectRatio}%`,
        backgroundColor: '#000',
        borderRadius: '4px',
        overflow: 'hidden',
      }}
    >
      {isVisible ? (
        <>
          {/* YouTube Player 컨테이너 - 상하단 UI 숨기기 위해 확대 */}
          <div
            id={playerContainerId}
            style={{
              position: 'absolute',
              top: '-80px', // 상단 제목/More Videos 숨기기
              left: '-10px',
              width: 'calc(100% + 20px)',
              height: 'calc(100% + 160px)', // 상하단 UI 숨기기 위해 더 확대
              border: 'none',
            }}
          />

          {/* 클릭 방지 오버레이 */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: 5,
              cursor: 'default',
              background: 'transparent',
            }}
          />

          {/* 컨트롤 버튼 컨테이너 - hover 시에만 표시 */}
          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              right: '16px',
              display: 'flex',
              gap: '8px',
              zIndex: 10,
              opacity: isHovered ? 1 : 0,
              pointerEvents: isHovered ? 'auto' : 'none',
              transition: 'opacity 0.3s ease',
            }}
          >
            {/* 재생/일시정지 토글 버튼 */}
            <button
              onClick={handlePlayPauseToggle}
              style={{
                width: '40px',
                height: '40px',
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                border: 'none',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s ease, transform 0.2s ease',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              aria-label={isPaused ? '재생' : '일시정지'}
            >
              {/* Play/Pause 아이콘 morphing - scale + fade */}
              <div style={{ position: 'relative', width: '20px', height: '20px' }}>
                {/* Pause 아이콘 */}
                <motion.svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="white"
                  initial={false}
                  animate={{
                    opacity: isPaused ? 0 : 1,
                    scale: isPaused ? 0.3 : 1,
                  }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  style={{ position: 'absolute', top: 0, left: 0 }}
                >
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </motion.svg>
                {/* Play 아이콘 - 90도 회전 */}
                <motion.svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="white"
                  initial={false}
                  animate={{
                    opacity: isPaused ? 1 : 0,
                    scale: isPaused ? 1 : 0.3,
                  }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(135deg)' }}
                >
                  <path d="M8 5v14l11-7z"/>
                </motion.svg>
              </div>
            </button>

            {/* 음소거 토글 버튼 */}
            <button
              onClick={handleMuteToggle}
              style={{
                width: '40px',
                height: '40px',
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                border: 'none',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s ease, transform 0.2s ease',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              aria-label={isMuted ? '소리 켜기' : '소리 끄기'}
            >
              {/* Mute/Unmute 아이콘 morphing */}
              <div style={{ position: 'relative', width: '20px', height: '20px' }}>
                {/* 음소거 아이콘 */}
                <motion.svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="white"
                  initial={false}
                  animate={{
                    opacity: isMuted ? 1 : 0,
                    scale: isMuted ? 1 : 0.5,
                  }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  style={{ position: 'absolute', top: 0, left: 0 }}
                >
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                </motion.svg>
                {/* 소리 켜짐 아이콘 */}
                <motion.svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="white"
                  initial={false}
                  animate={{
                    opacity: isMuted ? 0 : 1,
                    scale: isMuted ? 0.5 : 1,
                  }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  style={{ position: 'absolute', top: 0, left: 0 }}
                >
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                </motion.svg>
              </div>
            </button>

            {/* 전체화면 토글 버튼 */}
            <button
              onClick={handleFullscreenToggle}
              style={{
                width: '40px',
                height: '40px',
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                border: 'none',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s ease, transform 0.2s ease',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              aria-label={isFullscreen ? '전체화면 종료' : '전체화면'}
            >
              {/* Fullscreen 아이콘 morphing */}
              <div style={{ position: 'relative', width: '20px', height: '20px' }}>
                {/* 전체화면 진입 아이콘 */}
                <motion.svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="white"
                  initial={false}
                  animate={{
                    opacity: isFullscreen ? 0 : 1,
                    scale: isFullscreen ? 0.3 : 1,
                  }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  style={{ position: 'absolute', top: 0, left: 0 }}
                >
                  <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                </motion.svg>
                {/* 전체화면 종료 아이콘 */}
                <motion.svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="white"
                  initial={false}
                  animate={{
                    opacity: isFullscreen ? 1 : 0,
                    scale: isFullscreen ? 1 : 0.3,
                  }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  style={{ position: 'absolute', top: 0, left: 0 }}
                >
                  <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
                </motion.svg>
              </div>
            </button>
          </div>
        </>
      ) : (
        // 로딩 전 플레이스홀더 (썸네일)
        <img
          src={`https://img.youtube.com/vi/${pureVideoId}/maxresdefault.jpg`}
          alt={video.title || 'YouTube 영상'}
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${pureVideoId}/hqdefault.jpg`;
          }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      )}
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

// 캡션 컴포넌트 - 마지막 이미지 하단을 넘지 않도록 위치 조정
function CaptionWithBoundary({
  caption,
  captionId,
  renderCaption,
  mediaContainerRef,
}: {
  caption: string;
  captionId: string;
  renderCaption: (caption: string | undefined, captionId: string, isModal?: boolean) => React.ReactNode;
  mediaContainerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [captionBottom, setCaptionBottom] = useState(80); // 기본값 80px (var(--space-10))
  const captionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateCaptionPosition = () => {
      if (!mediaContainerRef.current || !captionRef.current) return;

      const mediaRect = mediaContainerRef.current.getBoundingClientRect();
      const captionHeight = captionRef.current.offsetHeight;
      const viewportHeight = window.innerHeight;

      // 기본 bottom 값 (뷰포트 하단에서 80px 위)
      const defaultBottom = 80;

      // 미디어 컨테이너의 하단이 뷰포트 내에 있을 때
      // 캡션이 미디어 하단 아래로 내려가지 않도록 조정
      const mediaBottomFromViewportBottom = viewportHeight - mediaRect.bottom;

      // 캡션의 하단이 미디어 하단보다 아래로 가면 조정
      if (mediaBottomFromViewportBottom > defaultBottom) {
        // 미디어가 위로 스크롤되어 하단이 뷰포트 위쪽에 있을 때
        // 캡션 bottom을 미디어 하단에 맞춤
        setCaptionBottom(Math.max(mediaBottomFromViewportBottom, defaultBottom));
      } else {
        setCaptionBottom(defaultBottom);
      }
    };

    // 초기 위치 설정
    updateCaptionPosition();

    // 스크롤 이벤트로 위치 업데이트
    window.addEventListener('scroll', updateCaptionPosition, { passive: true });
    window.addEventListener('resize', updateCaptionPosition, { passive: true });

    return () => {
      window.removeEventListener('scroll', updateCaptionPosition);
      window.removeEventListener('resize', updateCaptionPosition);
    };
  }, [mediaContainerRef]);

  return (
    <div
      ref={captionRef}
      className="work-caption"
      style={{
        position: 'fixed',
        left: 'calc(50% + var(--space-16) + 5%)',
        bottom: `${captionBottom}px`,
        width: '200px',
        maxWidth: 'calc(50% - var(--space-12) - 5%)',
        maxHeight: 'calc(100vh - 200px)',
        zIndex: 40,
        transition: 'bottom 0.15s ease-out',
      }}
    >
      {renderCaption(caption, captionId)}
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
      if (work) {
        // 이미지와 영상을 통합하여 첫 번째 미디어 ID 설정
        const mediaItems = getMediaItems(work);
        if (mediaItems.length > 0) {
          setModalCurrentImageId(mediaItems[0].data.id);
        }
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
                paddingLeft: getMediaItems(modalWork).length > 1 ? 'var(--space-2)' : 'var(--space-6)',
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

  // Get categories from shared context (no flickering on navigation)
  const { sentenceCategories, exhibitionCategories } = useCategories();

  const [work, setWork] = useState<Work | null>(null);
  const [relatedWorks, setRelatedWorks] = useState<Work[]>([]);
  // URL 파라미터로 직접 초기화하여 null → selected → null 상태 변경 방지
  // 이렇게 하면 페이지 이동 시 카테고리 애니메이션이 재실행되지 않음
  const [selectedKeywordId, setSelectedKeywordId] = useState<string | null>(urlKeywordId);
  const [selectedExhibitionCategoryId, setSelectedExhibitionCategoryId] = useState<string | null>(urlExhibitionId);
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

  // 초기 데이터 로드 (작업 데이터만 - 카테고리는 context에서 가져옴)
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const workData = await getWorkById(workId);

        if (!workData) {
          router.push('/');
          return;
        }

        setWork(workData);
        setSelectedWorkId(workId);

        // URL에서 전달받은 카테고리가 있으면 그것을 사용, 없으면 작품의 첫 번째 카테고리 사용
        // 주의: 상태는 이미 URL 파라미터로 초기화되어 있으므로, relatedWorks만 로드하면 됨
        if (urlKeywordId) {
          // URL에서 키워드 카테고리 전달받음 - 상태는 이미 초기화됨
          const allWorks = await getWorksByKeywordId(urlKeywordId);
          setRelatedWorks(allWorks);
          // setSelectedKeywordId는 이미 초기화되어 있으므로 호출하지 않음 (애니메이션 재실행 방지)
        } else if (urlExhibitionId) {
          // URL에서 전시명 카테고리 전달받음 - 상태는 이미 초기화됨
          const allWorks = await getWorksByExhibitionCategoryId(urlExhibitionId);
          setRelatedWorks(allWorks);
          // setSelectedExhibitionCategoryId는 이미 초기화되어 있으므로 호출하지 않음 (애니메이션 재실행 방지)
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

        // 첫 번째 미디어 ID 설정 (이미지 또는 영상)
        const mediaItems = getMediaItems(workData);
        if (mediaItems.length > 0) {
          const firstMedia = mediaItems[0];
          setCurrentImageId(firstMedia.data.id);
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

    // 첫 번째 미디어 ID 설정 (이미지 또는 영상)
    const mediaItems = getMediaItems(selectedWork);
    if (mediaItems.length > 0) {
      const firstMedia = mediaItems[0];
      setCurrentImageId(firstMedia.data.id);
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

  // 현재 카테고리의 작품 ID 목록 (disabled 상태 계산용)
  // Only depends on relatedWorks, NOT on the currently viewed work
  // This prevents categories from re-rendering when selecting different works within the same category
  const selectedWorkIds = useMemo(
    () => relatedWorks.map(w => w.id),
    [relatedWorks]
  );

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

  // 작품 선택 핸들러 - URL 업데이트 포함
  // window.history.replaceState를 사용하여 URL만 업데이트하고 페이지 리로드 방지
  // 이렇게 하면 작업 목록이 다시 fade-in되지 않고 dot만 이동
  const handleWorkSelect = useCallback((newWorkId: string) => {
    setSelectedWorkId(newWorkId);

    // URL 업데이트 (카테고리 정보 유지) - router.replace 대신 history API 사용
    const params = new URLSearchParams();
    if (selectedKeywordId) {
      params.set('keywordId', selectedKeywordId);
    } else if (selectedExhibitionCategoryId) {
      params.set('exhibitionId', selectedExhibitionCategoryId);
    }

    const queryString = params.toString();
    const newUrl = `/works/${newWorkId}${queryString ? `?${queryString}` : ''}`;
    
    // history.replaceState로 URL만 변경 (페이지 리마운트 없음)
    window.history.replaceState(null, '', newUrl);
  }, [selectedKeywordId, selectedExhibitionCategoryId]);

  // 카테고리 선택 핸들러 (상세 페이지에서는 네비게이션 용도)
  // Memoize to prevent category re-renders
  const handleKeywordSelect = useCallback(async (keywordId: string) => {
    const allWorks = await getWorksByKeywordId(keywordId);
    // 모든 작업을 relatedWorks에 저장 (현재 work 제외하지 않음 - Sidebar에서 전체 목록 사용)
    setRelatedWorks(allWorks);
    setSelectedKeywordId(keywordId);
    setSelectedExhibitionCategoryId(null);
    // 카테고리 변경 시 썸네일 리스트만 표시 (첫 번째 작업 자동 선택하지 않음)
    setSelectedWorkId(null);

    // URL 업데이트 (작품 ID는 유지, 카테고리만 변경)
    const newUrl = `/works/${workId}?keywordId=${keywordId}`;
    router.replace(newUrl, { scroll: false });
  }, [workId, router]);

  const handleExhibitionCategorySelect = useCallback(async (categoryId: string) => {
    const allWorks = await getWorksByExhibitionCategoryId(categoryId);
    // 모든 작업을 relatedWorks에 저장 (현재 work 제외하지 않음 - Sidebar에서 전체 목록 사용)
    setRelatedWorks(allWorks);
    setSelectedExhibitionCategoryId(categoryId);
    setSelectedKeywordId(null);
    // 카테고리 변경 시 썸네일 리스트만 표시 (첫 번째 작업 자동 선택하지 않음)
    setSelectedWorkId(null);

    // URL 업데이트 (작품 ID는 유지, 카테고리만 변경)
    const newUrl = `/works/${workId}?exhibitionId=${categoryId}`;
    router.replace(newUrl, { scroll: false });
  }, [workId, router]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 relative" style={{ paddingTop: '60px' }}>
        {/* 카테고리 영역 - 작품 선택과 완전히 독립적 */}
        <CategorySidebar
          sentenceCategories={sentenceCategories}
          exhibitionCategories={exhibitionCategories}
          selectedKeywordId={selectedKeywordId}
          selectedExhibitionCategoryId={selectedExhibitionCategoryId}
          onKeywordSelect={handleKeywordSelect}
          onExhibitionCategorySelect={handleExhibitionCategorySelect}
          selectedWorkIds={selectedWorkIds}
        />

        {/* 작업 목록 영역 - 좌측 (문장형 카테고리 선택 시) */}
        {relatedWorks.length > 0 && selectedKeywordId && (
          <div
            className="hidden lg:block absolute"
            style={{
              left: 'var(--category-margin-left)',
              top: 'var(--space-20)',
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
            className="hidden lg:block absolute"
            style={{
              right: 'var(--category-margin-right)',
              top: 'var(--space-20)',
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

        {/* 이미지 컨텐츠 영역 - 좌측 50% */}
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
            paddingTop: '320px', // 카테고리 영역(64px) + 작품 목록(~100px) + 썸네일 영역(~100px) + 여백(~56px)과 겹치지 않도록
          }}
        >
          {/* 선택된 작품의 미디어(이미지+영상) 표시 - AnimatePresence로 부드러운 전환 */}
          <AnimatePresence mode="sync">
          {selectedWorkId && (() => {
            // relatedWorks에서 선택된 작업 찾기 (카테고리 재선택 시에도 올바르게 동작)
            const selectedWork = relatedWorks.find((w) => w.id === selectedWorkId)
              || (selectedWorkId === workId ? work : null);

            // 이미지 또는 영상이 하나도 없으면 표시하지 않음
            const hasMedia = (selectedWork?.images?.length || 0) > 0 || (selectedWork?.videos?.length || 0) > 0;
            if (!selectedWork || !hasMedia) {
              return null;
            }

            // 이미지와 영상을 통합하여 order 순으로 정렬
            const sortedMedia = getMediaItems(selectedWork);
            // 하위 호환성을 위해 sortedImages도 유지
            const sortedImages = selectedWork.images.sort((a, b) => a.order - b.order);

            return (
              <motion.div
                key={selectedWorkId}
                initial={{ opacity: 0.85 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0.85 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
              >
                {/* 좌측 고정 타임라인 UI - 미디어가 2개 이상일 때만 표시 */}
                {sortedMedia.length > 1 && (
                  <div
                    style={{
                      position: 'fixed',
                      left: 'var(--category-margin-left)', // 카테고리, 작업 목록과 동일한 시작점 (48px)
                      top: '70%',
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
                            return '50px';
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

                {/* 컨텐츠 영역: 미디어 + 캡션을 flex로 배치 */}
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

                      // 영상인 경우 - YouTubeEmbed 컴포넌트 사용 (썸네일 + 커스텀 재생 버튼)
                      if (item.type === 'video') {
                        const video = item.data;
                        return (
                          <div
                            key={video.id}
                            className="work-media-container"
                            style={{
                              position: 'relative',
                              width: '100%',
                              scrollSnapAlign: 'start',
                              scrollMarginTop: '280px',
                            }}
                          >
                            <YouTubeEmbed video={video} isLast={isLast} />
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

                </div>

                {/* 우측: 캡션 - fixed로 하단 고정 */}
                {selectedWork.caption && (
                  <CaptionWithBoundary
                    caption={selectedWork.caption}
                    captionId={selectedWork.id}
                    renderCaption={renderCaption}
                    mediaContainerRef={imageScrollContainerRef}
                  />
                )}
              </motion.div>
            );
          })()}
          </AnimatePresence>
        </main>
        )}
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
        {hoveredWorkId && (() => {
          // Find the hovered work from relatedWorks or current work
          const hoveredWork = relatedWorks.find((w) => w.id === hoveredWorkId)
            || (hoveredWorkId === workId ? work : null);

          if (!hoveredWork) return null;

          return (
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
