// YouTube IFrame Player API 타입 선언

/**
 * YouTube Player 인스턴스 인터페이스
 */
export interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  destroy: () => void;
  getPlayerState: () => number;
}

/**
 * YouTube Player 설정 인터페이스
 */
export interface YTPlayerConfig {
  videoId: string;
  playerVars?: Record<string, number | string>;
  events?: {
    onReady?: (event: { target: YTPlayer }) => void;
    onStateChange?: (event: { data: number }) => void;
  };
}

/**
 * YouTube Player State 상수
 */
export interface YTPlayerState {
  ENDED: number;
  PLAYING: number;
  PAUSED: number;
  BUFFERING: number;
  CUED: number;
}

/**
 * Window 확장 - YouTube API
 */
declare global {
  interface Window {
    YT: {
      Player: new (elementId: string, config: YTPlayerConfig) => YTPlayer;
      PlayerState: YTPlayerState;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

// YouTube IFrame API 로드 상태 관리
let isYTApiLoaded = false;
let ytApiReadyCallbacks: (() => void)[] = [];

/**
 * YouTube IFrame API 로드 (싱글톤 패턴)
 * 여러 번 호출해도 한 번만 로드됨
 *
 * @returns API 로드 완료 Promise
 */
export function loadYouTubeAPI(): Promise<void> {
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

