import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeywordState } from '../../hooks/useKeywordState';
import type { KeywordCategory } from '../../../core/types';

const createMockKeyword = (overrides?: Partial<KeywordCategory>): KeywordCategory => ({
  id: 'keyword-1',
  name: 'test keyword',
  startIndex: 0,
  endIndex: 10,
  workOrders: [],
  ...overrides,
});

describe('useKeywordState', () => {
  it('should return "active" when keyword is selected', () => {
    const keyword = createMockKeyword();
    const { result } = renderHook(() =>
      useKeywordState({
        keyword,
        isSelected: true,
        isHovered: false,
        selectedWorkIds: [],
      })
    );

    expect(result.current).toBe('active');
  });

  it('should return "hover" when keyword is hovered but not selected', () => {
    const keyword = createMockKeyword();
    const { result } = renderHook(() =>
      useKeywordState({
        keyword,
        isSelected: false,
        isHovered: true,
        selectedWorkIds: [],
      })
    );

    expect(result.current).toBe('hover');
  });

  it('should return "clickable" even when keyword has no common works with selected category', () => {
    // 'disabled' 상태는 내비게이션 버그(다른 카테고리 선택 후 첫 전시 카테고리가
    // 클릭 불가가 되는 문제) 때문에 의도적으로 제거됨. 이제 항상 'clickable' 반환.
    const keyword = createMockKeyword({
      workOrders: [{ workId: 'work-1', order: 1 }],
    });

    const { result } = renderHook(() =>
      useKeywordState({
        keyword,
        isSelected: false,
        isHovered: false,
        selectedWorkIds: ['work-2', 'work-3'], // Different works
      })
    );

    expect(result.current).toBe('clickable');
  });

  it('should return "clickable" when keyword has common works with selected category', () => {
    const keyword = createMockKeyword({
      workOrders: [
        { workId: 'work-1', order: 1 },
        { workId: 'work-2', order: 2 },
      ],
    });

    const { result } = renderHook(() =>
      useKeywordState({
        keyword,
        isSelected: false,
        isHovered: false,
        selectedWorkIds: ['work-2', 'work-3'], // Has common work-2
      })
    );

    expect(result.current).toBe('clickable');
  });

  it('should return "clickable" when no category is selected', () => {
    const keyword = createMockKeyword({
      workOrders: [{ workId: 'work-1', order: 1 }],
    });

    const { result } = renderHook(() =>
      useKeywordState({
        keyword,
        isSelected: false,
        isHovered: false,
        selectedWorkIds: [], // No selection
      })
    );

    expect(result.current).toBe('clickable');
  });

  it('should return "clickable" for keywords with empty workOrders', () => {
    const keyword = createMockKeyword({
      workOrders: [],
    });

    const { result } = renderHook(() =>
      useKeywordState({
        keyword,
        isSelected: false,
        isHovered: false,
        selectedWorkIds: ['work-1'], // Even with selection
      })
    );

    // Empty workOrders means works are linked via Work.sentenceCategoryIds
    expect(result.current).toBe('clickable');
  });

  it('should prioritize selected over hovered state', () => {
    const keyword = createMockKeyword();
    const { result } = renderHook(() =>
      useKeywordState({
        keyword,
        isSelected: true,
        isHovered: true, // Both selected and hovered
        selectedWorkIds: [],
      })
    );

    expect(result.current).toBe('active'); // Selected takes priority
  });

  it('should update when dependencies change', () => {
    const keyword = createMockKeyword();
    const { result, rerender } = renderHook(
      ({ isSelected }) =>
        useKeywordState({
          keyword,
          isSelected,
          isHovered: false,
          selectedWorkIds: [],
        }),
      { initialProps: { isSelected: false } }
    );

    expect(result.current).toBe('clickable');

    rerender({ isSelected: true });
    expect(result.current).toBe('active');
  });
});
