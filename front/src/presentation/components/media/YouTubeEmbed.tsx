'use client';

/**
 * YouTube 영상 Embed 컴포넌트
 * 뷰포트 진입 시 자동재생 (뮤트) + 루프 기능 제공
 * 커스텀 컨트롤 버튼으로 재생/일시정지, 음소거, 전체화면 조작 가능
 */

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  loadYouTubeAPI,
  extractPureYouTubeVideoId,
  type YTPlayer,
} from '@/core/utils';
import type { WorkVideo } from '@/types';

interface YouTubeEmbedProps {
  /** 비디오 정보 객체 */
  video: WorkVideo;
  /** 마지막 아이템 여부 (하단 마진 결정) */
  isLast?: boolean;
}

export default function YouTubeEmbed({ video, isLast = false }: YouTubeEmbedProps) {
  // 상태 관리
  const [isVisible, setIsVisible] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [isApiReady, setIsApiReady] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const playerContainerId = `yt-player-${video.id}`;

  // 순수 video ID 추출 (list, index 등 파라미터 제거)
  const pureVideoId = extractPureYouTubeVideoId(video.youtubeVideoId);

  // 원본 비율이 있으면 사용, 없으면 기본 16:9 (56.25%)
  const aspectRatio =
    video.width && video.height ? (video.height / video.width) * 100 : 56.25;

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
    // playerContainerId is derived from video.id and doesn't need to be in dependencies
    // pureVideoId already captures the video identity
  }, [isVisible, isApiReady, pureVideoId]);

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

  // 공통 버튼 스타일
  const buttonBaseStyle: React.CSSProperties = {
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
  };

  // 버튼 호버 핸들러
  const handleButtonMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    e.currentTarget.style.transform = 'scale(1.05)';
  };

  const handleButtonMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
    e.currentTarget.style.transform = 'scale(1)';
  };

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
              style={buttonBaseStyle}
              onMouseEnter={handleButtonMouseEnter}
              onMouseLeave={handleButtonMouseLeave}
              aria-label={isPaused ? '재생' : '일시정지'}
            >
              <div style={{ position: 'relative', width: '20px', height: '20px' }}>
                {/* Pause 아이콘 */}
                <motion.svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="white"
                  initial={false}
                  animate={{ opacity: isPaused ? 0 : 1, scale: isPaused ? 0.3 : 1 }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  style={{ position: 'absolute', top: 0, left: 0 }}
                >
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </motion.svg>
                {/* Play 아이콘 */}
                <motion.svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="white"
                  initial={false}
                  animate={{ opacity: isPaused ? 1 : 0, scale: isPaused ? 1 : 0.3 }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(135deg)' }}
                >
                  <path d="M8 5v14l11-7z" />
                </motion.svg>
              </div>
            </button>

            {/* 음소거 토글 버튼 */}
            <button
              onClick={handleMuteToggle}
              style={buttonBaseStyle}
              onMouseEnter={handleButtonMouseEnter}
              onMouseLeave={handleButtonMouseLeave}
              aria-label={isMuted ? '소리 켜기' : '소리 끄기'}
            >
              <div style={{ position: 'relative', width: '20px', height: '20px' }}>
                {/* 음소거 아이콘 */}
                <motion.svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="white"
                  initial={false}
                  animate={{ opacity: isMuted ? 1 : 0, scale: isMuted ? 1 : 0.5 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  style={{ position: 'absolute', top: 0, left: 0 }}
                >
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                </motion.svg>
                {/* 소리 켜짐 아이콘 */}
                <motion.svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="white"
                  initial={false}
                  animate={{ opacity: isMuted ? 0 : 1, scale: isMuted ? 0.5 : 1 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  style={{ position: 'absolute', top: 0, left: 0 }}
                >
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                </motion.svg>
              </div>
            </button>

            {/* 전체화면 토글 버튼 */}
            <button
              onClick={handleFullscreenToggle}
              style={buttonBaseStyle}
              onMouseEnter={handleButtonMouseEnter}
              onMouseLeave={handleButtonMouseLeave}
              aria-label={isFullscreen ? '전체화면 종료' : '전체화면'}
            >
              <div style={{ position: 'relative', width: '20px', height: '20px' }}>
                {/* 전체화면 진입 아이콘 */}
                <motion.svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="white"
                  initial={false}
                  animate={{ opacity: isFullscreen ? 0 : 1, scale: isFullscreen ? 0.3 : 1 }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  style={{ position: 'absolute', top: 0, left: 0 }}
                >
                  <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                </motion.svg>
                {/* 전체화면 종료 아이콘 */}
                <motion.svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="white"
                  initial={false}
                  animate={{ opacity: isFullscreen ? 1 : 0, scale: isFullscreen ? 1 : 0.3 }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  style={{ position: 'absolute', top: 0, left: 0 }}
                >
                  <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
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

