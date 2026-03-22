/**
 * UIStateContext 동작 보증 테스트
 *
 * 리팩토링 전/후 동일한 동작을 보장하기 위해
 * 현재 구현의 상태/액션/셀렉터 동작을 명세합니다.
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React, { ReactNode } from 'react';
import {
  UIStateProvider,
  useUIState,
  useHoveredWorkId,
  useHoverPosition,
  useIsHovering,
  useModalWorkId,
  useIsModalOpen,
  useMobileMenuOpen,
  useIsMobileMenuOpen,
  useZoomedImage,
  useIsZoomOpen,
} from '../../contexts/UIStateContext';

const wrapper = ({ children }: { children: ReactNode }) => (
  <UIStateProvider>{children}</UIStateProvider>
);

// ────────────────────────────────────────────────────────────────
// 초기 상태
// ────────────────────────────────────────────────────────────────
describe('UIStateContext - 초기 상태', () => {
  it('hoveredWorkId는 null이어야 한다', () => {
    const { result } = renderHook(() => useHoveredWorkId(), { wrapper });
    expect(result.current).toBeNull();
  });

  it('hoverPosition은 { x: 0, y: 0 }이어야 한다', () => {
    const { result } = renderHook(() => useHoverPosition(), { wrapper });
    expect(result.current).toEqual({ x: 0, y: 0 });
  });

  it('modalWorkId는 null이어야 한다', () => {
    const { result } = renderHook(() => useModalWorkId(), { wrapper });
    expect(result.current).toBeNull();
  });

  it('mobileMenuOpen은 false이어야 한다', () => {
    const { result } = renderHook(() => useMobileMenuOpen(), { wrapper });
    expect(result.current).toBe(false);
  });

  it('zoomedImage는 null이어야 한다', () => {
    const { result } = renderHook(() => useZoomedImage(), { wrapper });
    expect(result.current).toBeNull();
  });

  it('isHovering 셀렉터는 false이어야 한다', () => {
    const { result } = renderHook(() => useIsHovering(), { wrapper });
    expect(result.current).toBe(false);
  });

  it('isModalOpen 셀렉터는 false이어야 한다', () => {
    const { result } = renderHook(() => useIsModalOpen(), { wrapper });
    expect(result.current).toBe(false);
  });

  it('isMobileMenuOpen 셀렉터는 false이어야 한다', () => {
    const { result } = renderHook(() => useIsMobileMenuOpen(), { wrapper });
    expect(result.current).toBe(false);
  });

  it('isZoomOpen 셀렉터는 false이어야 한다', () => {
    const { result } = renderHook(() => useIsZoomOpen(), { wrapper });
    expect(result.current).toBe(false);
  });
});

// ────────────────────────────────────────────────────────────────
// Hover 액션
// ────────────────────────────────────────────────────────────────
describe('UIStateContext - Hover 액션', () => {
  it('setHoveredWork(workId)는 hoveredWorkId를 설정한다', () => {
    const { result } = renderHook(() => useUIState(), { wrapper });

    act(() => {
      result.current.setHoveredWork('work-123');
    });

    expect(result.current.hoveredWorkId).toBe('work-123');
  });

  it('setHoveredWork(workId, position)는 position도 함께 업데이트한다', () => {
    const { result } = renderHook(() => useUIState(), { wrapper });

    act(() => {
      result.current.setHoveredWork('work-123', { x: 100, y: 200 });
    });

    expect(result.current.hoveredWorkId).toBe('work-123');
    expect(result.current.hoverPosition).toEqual({ x: 100, y: 200 });
  });

  it('setHoveredWork(workId) - position 미전달 시 기존 position을 유지한다', () => {
    const { result } = renderHook(() => useUIState(), { wrapper });

    act(() => {
      result.current.setHoveredWork('work-1', { x: 50, y: 60 });
    });
    act(() => {
      result.current.setHoveredWork('work-2'); // position 없음
    });

    expect(result.current.hoveredWorkId).toBe('work-2');
    expect(result.current.hoverPosition).toEqual({ x: 50, y: 60 }); // 변경 안 됨
  });

  it('clearHover()는 hoveredWorkId를 null로 만든다', () => {
    const { result } = renderHook(() => useUIState(), { wrapper });

    act(() => {
      result.current.setHoveredWork('work-123', { x: 10, y: 20 });
    });
    act(() => {
      result.current.clearHover();
    });

    expect(result.current.hoveredWorkId).toBeNull();
  });

  it('clearHover() 후 isHovering 셀렉터는 false가 된다', () => {
    const { result } = renderHook(() => useUIState(), { wrapper });

    act(() => {
      result.current.setHoveredWork('work-123');
    });
    expect(result.current.isHovering).toBe(true);

    act(() => {
      result.current.clearHover();
    });
    expect(result.current.isHovering).toBe(false);
  });

  it('hoveredWorkId가 null이 아닐 때 isHovering은 true이다', () => {
    const { result } = renderHook(() => useUIState(), { wrapper });

    act(() => {
      result.current.setHoveredWork('work-abc');
    });

    expect(result.current.isHovering).toBe(true);
  });
});

// ────────────────────────────────────────────────────────────────
// Modal 액션
// ────────────────────────────────────────────────────────────────
describe('UIStateContext - Modal 액션', () => {
  it('openModal(workId)는 modalWorkId를 설정한다', () => {
    const { result } = renderHook(() => useUIState(), { wrapper });

    act(() => {
      result.current.openModal('work-456');
    });

    expect(result.current.modalWorkId).toBe('work-456');
  });

  it('openModal() 후 isModalOpen 셀렉터는 true가 된다', () => {
    const { result } = renderHook(() => useUIState(), { wrapper });

    act(() => {
      result.current.openModal('work-456');
    });

    expect(result.current.isModalOpen).toBe(true);
  });

  it('closeModal()은 modalWorkId를 null로 만든다', () => {
    const { result } = renderHook(() => useUIState(), { wrapper });

    act(() => {
      result.current.openModal('work-456');
    });
    act(() => {
      result.current.closeModal();
    });

    expect(result.current.modalWorkId).toBeNull();
    expect(result.current.isModalOpen).toBe(false);
  });
});

// ────────────────────────────────────────────────────────────────
// Mobile Menu 액션
// ────────────────────────────────────────────────────────────────
describe('UIStateContext - Mobile Menu 액션', () => {
  it('setMobileMenuOpen(true)은 mobileMenuOpen을 true로 만든다', () => {
    const { result } = renderHook(() => useUIState(), { wrapper });

    act(() => {
      result.current.setMobileMenuOpen(true);
    });

    expect(result.current.mobileMenuOpen).toBe(true);
  });

  it('setMobileMenuOpen(false)은 mobileMenuOpen을 false로 만든다', () => {
    const { result } = renderHook(() => useUIState(), { wrapper });

    act(() => {
      result.current.setMobileMenuOpen(true);
    });
    act(() => {
      result.current.setMobileMenuOpen(false);
    });

    expect(result.current.mobileMenuOpen).toBe(false);
  });

  it('toggleMobileMenu()는 false → true로 토글한다', () => {
    const { result } = renderHook(() => useUIState(), { wrapper });

    act(() => {
      result.current.toggleMobileMenu();
    });

    expect(result.current.mobileMenuOpen).toBe(true);
  });

  it('toggleMobileMenu()는 true → false로 토글한다', () => {
    const { result } = renderHook(() => useUIState(), { wrapper });

    act(() => {
      result.current.setMobileMenuOpen(true);
    });
    act(() => {
      result.current.toggleMobileMenu();
    });

    expect(result.current.mobileMenuOpen).toBe(false);
  });

  it('isMobileMenuOpen 셀렉터는 mobileMenuOpen과 동일하다', () => {
    const { result } = renderHook(() => useUIState(), { wrapper });

    act(() => {
      result.current.setMobileMenuOpen(true);
    });

    expect(result.current.isMobileMenuOpen).toBe(result.current.mobileMenuOpen);
  });
});

// ────────────────────────────────────────────────────────────────
// Zoom 액션
// ────────────────────────────────────────────────────────────────
describe('UIStateContext - Zoom 액션', () => {
  const imageData = { src: 'https://example.com/img.jpg', alt: 'test', width: 800, height: 600 };

  it('openZoom(imageData)는 zoomedImage를 설정한다', () => {
    const { result } = renderHook(() => useUIState(), { wrapper });

    act(() => {
      result.current.openZoom(imageData);
    });

    expect(result.current.zoomedImage).toEqual(imageData);
  });

  it('openZoom() 후 isZoomOpen 셀렉터는 true가 된다', () => {
    const { result } = renderHook(() => useUIState(), { wrapper });

    act(() => {
      result.current.openZoom(imageData);
    });

    expect(result.current.isZoomOpen).toBe(true);
  });

  it('closeZoom()은 zoomedImage를 null로 만든다', () => {
    const { result } = renderHook(() => useUIState(), { wrapper });

    act(() => {
      result.current.openZoom(imageData);
    });
    act(() => {
      result.current.closeZoom();
    });

    expect(result.current.zoomedImage).toBeNull();
    expect(result.current.isZoomOpen).toBe(false);
  });
});

// ────────────────────────────────────────────────────────────────
// Provider 외부 사용 시 에러
// ────────────────────────────────────────────────────────────────
describe('UIStateContext - Provider 없이 사용', () => {
  it('Provider 없이 useUIState를 사용하면 에러가 발생한다', () => {
    expect(() => {
      renderHook(() => useUIState());
    }).toThrow('useUIState must be used within a UIStateProvider');
  });
});

// ────────────────────────────────────────────────────────────────
// 상태 독립성
// ────────────────────────────────────────────────────────────────
describe('UIStateContext - 상태 독립성', () => {
  it('hover, modal, zoom 상태는 서로 독립적으로 동작한다', () => {
    const { result } = renderHook(() => useUIState(), { wrapper });

    act(() => {
      result.current.setHoveredWork('work-1', { x: 10, y: 20 });
      result.current.openModal('work-2');
      result.current.openZoom({ src: 'img.jpg', alt: 'img', width: 400, height: 300 });
    });

    expect(result.current.hoveredWorkId).toBe('work-1');
    expect(result.current.modalWorkId).toBe('work-2');
    expect(result.current.zoomedImage).not.toBeNull();
    expect(result.current.isHovering).toBe(true);
    expect(result.current.isModalOpen).toBe(true);
    expect(result.current.isZoomOpen).toBe(true);
  });
});
