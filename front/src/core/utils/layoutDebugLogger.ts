/**
 * 레이아웃 디버깅 로거
 *
 * Window resize, 컴포넌트 mount/update 시점의 모든 측정값을 추적
 * 콘솔에 출력하고 전역 저장소에 보관하여 나중에 내보낼 수 있음
 */

export interface LayoutLog {
  timestamp: number;
  timeString: string;
  component: string;
  event: string;
  data: Record<string, unknown>;
}

// 전역 로그 저장소
declare global {
  interface Window {
    __LAYOUT_DEBUG_LOGS__?: LayoutLog[];
    __EXPORT_LAYOUT_LOGS__?: () => void;
    __CLEAR_LAYOUT_LOGS__?: () => void;
  }
}

// 로그 색상 맵핑
const COMPONENT_COLORS: Record<string, string> = {
  PortfolioLayout: '#3B82F6',      // blue
  CaptionWithBoundary: '#10B981',  // green
  MediaTimeline: '#F59E0B',        // amber
  WorkListScroller: '#8B5CF6',     // purple
  CategorySidebar: '#EC4899',      // pink
};

class LayoutDebugLogger {
  private enabled: boolean = true;

  constructor() {
    // 전역 저장소 초기화
    if (typeof window !== 'undefined') {
      window.__LAYOUT_DEBUG_LOGS__ = window.__LAYOUT_DEBUG_LOGS__ || [];

      // 전역 함수 등록 - 로그 내보내기
      window.__EXPORT_LAYOUT_LOGS__ = () => {
        const logs = window.__LAYOUT_DEBUG_LOGS__ || [];
        const json = JSON.stringify(logs, null, 2);
        console.log('📋 Total logs:', logs.length);
        console.log('📦 Exported logs (copy this):');
        console.log(json);

        // 클립보드에 복사
        if (navigator.clipboard) {
          navigator.clipboard.writeText(json).then(() => {
            console.log('✅ Logs copied to clipboard!');
          });
        }

        return logs;
      };

      // 전역 함수 등록 - 로그 삭제
      window.__CLEAR_LAYOUT_LOGS__ = () => {
        if (window.__LAYOUT_DEBUG_LOGS__) {
          const count = window.__LAYOUT_DEBUG_LOGS__.length;
          window.__LAYOUT_DEBUG_LOGS__ = [];
          console.log(`🗑️ Cleared ${count} logs`);
        }
      };

      console.log('🔧 Layout Debug Logger initialized');
      console.log('📝 Use window.__EXPORT_LAYOUT_LOGS__() to export logs');
      console.log('🗑️ Use window.__CLEAR_LAYOUT_LOGS__() to clear logs');
    }
  }

  log(component: string, event: string, data: Record<string, unknown> = {}) {
    if (!this.enabled || typeof window === 'undefined') return;

    const timestamp = Date.now();
    const timeString = new Date(timestamp).toISOString();

    const log: LayoutLog = {
      timestamp,
      timeString,
      component,
      event,
      data,
    };

    // 전역 저장소에 추가
    window.__LAYOUT_DEBUG_LOGS__ = window.__LAYOUT_DEBUG_LOGS__ || [];
    window.__LAYOUT_DEBUG_LOGS__.push(log);

    // 콘솔에 출력 (색상 포함)
    const color = COMPONENT_COLORS[component] || '#6B7280';
    const emoji = this.getEventEmoji(event);

    console.groupCollapsed(
      `%c${emoji} [${component}] ${event}`,
      `color: ${color}; font-weight: bold;`,
      timeString
    );
    console.log('Data:', data);
    console.log('Full log:', log);
    console.groupEnd();
  }

  private getEventEmoji(event: string): string {
    if (event.includes('mount')) return '🎬';
    if (event.includes('unmount')) return '🎬';
    if (event.includes('resize')) return '📏';
    if (event.includes('scroll')) return '📜';
    if (event.includes('update')) return '🔄';
    if (event.includes('calculate')) return '🧮';
    if (event.includes('measure')) return '📐';
    if (event.includes('error')) return '❌';
    if (event.includes('warning')) return '⚠️';
    return '📊';
  }

  // 특정 컴포넌트의 로그만 필터링
  getLogsByComponent(component: string): LayoutLog[] {
    if (typeof window === 'undefined') return [];
    return (window.__LAYOUT_DEBUG_LOGS__ || []).filter(log => log.component === component);
  }

  // 특정 시간 범위의 로그만 필터링
  getLogsByTimeRange(startTime: number, endTime: number): LayoutLog[] {
    if (typeof window === 'undefined') return [];
    return (window.__LAYOUT_DEBUG_LOGS__ || []).filter(
      log => log.timestamp >= startTime && log.timestamp <= endTime
    );
  }
}

// 싱글톤 인스턴스
export const layoutLogger = new LayoutDebugLogger();

// 편의 함수들
export const logLayout = (component: string, event: string, data?: Record<string, unknown>) => {
  layoutLogger.log(component, event, data);
};

// Viewport 정보 수집 헬퍼
export const getViewportInfo = () => {
  if (typeof window === 'undefined') return {};

  return {
    windowWidth: window.innerWidth,
    windowHeight: window.innerHeight,
    scrollY: window.scrollY,
    scrollX: window.scrollX,
    documentHeight: document.documentElement.scrollHeight,
    documentWidth: document.documentElement.scrollWidth,
  };
};

// Element 위치 정보 수집 헬퍼
export const getElementInfo = (element: HTMLElement | null, name: string = 'element') => {
  if (!element) return { [name]: 'null' };

  const rect = element.getBoundingClientRect();

  return {
    [`${name}_offsetTop`]: element.offsetTop,
    [`${name}_offsetLeft`]: element.offsetLeft,
    [`${name}_offsetWidth`]: element.offsetWidth,
    [`${name}_offsetHeight`]: element.offsetHeight,
    [`${name}_rect_top`]: rect.top,
    [`${name}_rect_left`]: rect.left,
    [`${name}_rect_width`]: rect.width,
    [`${name}_rect_height`]: rect.height,
    [`${name}_rect_bottom`]: rect.bottom,
    [`${name}_rect_right`]: rect.right,
  };
};

/**
 * Breakpoint 감지 헬퍼
 *
 * Breakpoints:
 * - xs: 0 ~ 480px
 * - sm: 481px ~ 600px
 * - md: 601px ~ 767px
 * - lg: 768px ~ 1024px
 * - xl: 1025px ~ 1280px
 * - 2xl: 1281px+
 */
export const getBreakpoint = (width: number = typeof window !== 'undefined' ? window.innerWidth : 0): string => {
  if (width <= 480) return 'xs';
  if (width <= 600) return 'sm';
  if (width <= 767) return 'md';
  if (width <= 1024) return 'lg';
  if (width <= 1280) return 'xl';
  return '2xl';
};

// Breakpoint 변경 감지 (이전 width와 비교)
export const detectBreakpointChange = (previousWidth: number, currentWidth: number): {
  changed: boolean;
  from: string;
  to: string;
} => {
  const previousBreakpoint = getBreakpoint(previousWidth);
  const currentBreakpoint = getBreakpoint(currentWidth);

  return {
    changed: previousBreakpoint !== currentBreakpoint,
    from: previousBreakpoint,
    to: currentBreakpoint,
  };
};