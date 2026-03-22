/**
 * useModalLinkHandler 동작 보증 테스트
 *
 * 리팩토링으로 분리된 hook의 동작을 검증합니다.
 * WorkModal, WorkModalMobile 모두 이 hook을 통해 링크 클릭을 처리합니다.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useModalLinkHandler } from '../../hooks/useModalLinkHandler';

describe('useModalLinkHandler', () => {
  let onWorkClick: (workId: string) => void;
  let clearHover: () => void;

  beforeEach(() => {
    onWorkClick = vi.fn() as (workId: string) => void;
    clearHover = vi.fn() as () => void;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ────────────────────────────────────────────────────────────────
  // document.body 이벤트 리스너 등록/해제
  // ────────────────────────────────────────────────────────────────

  it('document.body에 click 이벤트 리스너를 등록한다', () => {
    const spy = vi.spyOn(document.body, 'addEventListener');
    renderHook(() => useModalLinkHandler(onWorkClick, clearHover));
    expect(spy).toHaveBeenCalledWith('click', expect.any(Function));
    spy.mockRestore();
  });

  it('unmount 시 document.body에서 click 이벤트 리스너를 제거한다', () => {
    const spy = vi.spyOn(document.body, 'removeEventListener');
    const { unmount } = renderHook(() => useModalLinkHandler(onWorkClick, clearHover));
    unmount();
    expect(spy).toHaveBeenCalledWith('click', expect.any(Function));
    spy.mockRestore();
  });

  // ────────────────────────────────────────────────────────────────
  // 핸들러 로직: [data-is-modal="true"] 내부 링크
  // ────────────────────────────────────────────────────────────────

  function getBodyClickHandler(): (e: Event) => void {
    let handler: ((e: Event) => void) | null = null;
    const spy = vi.spyOn(document.body, 'addEventListener').mockImplementation(
      (type: string, fn: EventListenerOrEventListenerObject) => {
        if (type === 'click') handler = fn as (e: Event) => void;
      }
    );
    renderHook(() => useModalLinkHandler(onWorkClick, clearHover));
    spy.mockRestore();
    return handler!;
  }

  it('[data-is-modal="true"] 내부의 a[data-work-id] 클릭 시 onWorkClick(workId)를 호출한다', () => {
    const handler = getBodyClickHandler();

    const container = document.createElement('div');
    container.setAttribute('data-is-modal', 'true');
    const link = document.createElement('a');
    link.setAttribute('data-work-id', 'work-abc');
    container.appendChild(link);
    document.body.appendChild(container);

    handler({ target: link, preventDefault: vi.fn() } as unknown as Event);

    expect(onWorkClick).toHaveBeenCalledWith('work-abc');

    document.body.removeChild(container);
  });

  it('[data-is-modal="true"] 내부 링크 클릭 시 clearHover를 호출한다', () => {
    const handler = getBodyClickHandler();

    const container = document.createElement('div');
    container.setAttribute('data-is-modal', 'true');
    const link = document.createElement('a');
    link.setAttribute('data-work-id', 'work-abc');
    container.appendChild(link);
    document.body.appendChild(container);

    handler({ target: link, preventDefault: vi.fn() } as unknown as Event);

    expect(clearHover).toHaveBeenCalled();

    document.body.removeChild(container);
  });

  it('[data-is-modal="true"] 내부 링크 클릭 시 preventDefault를 호출한다', () => {
    const handler = getBodyClickHandler();

    const container = document.createElement('div');
    container.setAttribute('data-is-modal', 'true');
    const link = document.createElement('a');
    link.setAttribute('data-work-id', 'work-abc');
    container.appendChild(link);
    document.body.appendChild(container);

    const preventDefault = vi.fn();
    handler({ target: link, preventDefault } as unknown as Event);

    expect(preventDefault).toHaveBeenCalled();

    document.body.removeChild(container);
  });

  // ────────────────────────────────────────────────────────────────
  // 핸들러 로직: 무시해야 할 케이스
  // ────────────────────────────────────────────────────────────────

  it('[data-is-modal="true"] 외부의 a[data-work-id] 클릭은 무시한다', () => {
    const handler = getBodyClickHandler();

    const link = document.createElement('a');
    link.setAttribute('data-work-id', 'work-outside');
    document.body.appendChild(link);

    handler({ target: link, preventDefault: vi.fn() } as unknown as Event);

    expect(onWorkClick).not.toHaveBeenCalled();
    expect(clearHover).not.toHaveBeenCalled();

    document.body.removeChild(link);
  });

  it('data-work-id가 없는 일반 링크 클릭은 무시한다', () => {
    const handler = getBodyClickHandler();

    const container = document.createElement('div');
    container.setAttribute('data-is-modal', 'true');
    const link = document.createElement('a');
    link.href = 'https://example.com';
    container.appendChild(link);
    document.body.appendChild(container);

    handler({ target: link, preventDefault: vi.fn() } as unknown as Event);

    expect(onWorkClick).not.toHaveBeenCalled();

    document.body.removeChild(container);
  });

  it('링크가 아닌 요소 클릭은 무시한다', () => {
    const handler = getBodyClickHandler();

    const div = document.createElement('div');
    document.body.appendChild(div);

    handler({ target: div, preventDefault: vi.fn() } as unknown as Event);

    expect(onWorkClick).not.toHaveBeenCalled();
    expect(clearHover).not.toHaveBeenCalled();

    document.body.removeChild(div);
  });

  it('링크의 자식 요소 클릭도 올바르게 처리한다 (closest 활용)', () => {
    const handler = getBodyClickHandler();

    const container = document.createElement('div');
    container.setAttribute('data-is-modal', 'true');
    const link = document.createElement('a');
    link.setAttribute('data-work-id', 'work-child');
    const span = document.createElement('span');
    span.textContent = '링크 텍스트';
    link.appendChild(span);
    container.appendChild(link);
    document.body.appendChild(container);

    // span(자식)을 클릭 대상으로
    handler({ target: span, preventDefault: vi.fn() } as unknown as Event);

    expect(onWorkClick).toHaveBeenCalledWith('work-child');

    document.body.removeChild(container);
  });
});
