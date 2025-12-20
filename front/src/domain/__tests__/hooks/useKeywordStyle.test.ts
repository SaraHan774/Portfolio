import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeywordStyle } from '../../hooks/useKeywordStyle';
import type { CategoryState } from '../../../core/types';

describe('useKeywordStyle', () => {
  it('should return basic styles for "basic" state', () => {
    const { result } = renderHook(() => useKeywordStyle('basic' as CategoryState));

    expect(result.current).toMatchObject({
      position: 'relative',
      display: 'inline-block',
      transition: 'color 0.2s ease-in-out',
      color: 'var(--color-category-basic)',
      cursor: 'default',
    });
  });

  it('should return clickable styles for "clickable" state', () => {
    const { result } = renderHook(() => useKeywordStyle('clickable' as CategoryState));

    expect(result.current).toMatchObject({
      position: 'relative',
      display: 'inline-block',
      transition: 'color 0.2s ease-in-out',
      color: 'var(--color-category-clickable)',
      cursor: 'pointer',
    });
  });

  it('should return hover styles for "hover" state', () => {
    const { result } = renderHook(() => useKeywordStyle('hover' as CategoryState));

    expect(result.current).toMatchObject({
      position: 'relative',
      display: 'inline-block',
      transition: 'color 0.2s ease-in-out',
      color: 'transparent',
      WebkitTextStroke: '0.7px var(--color-category-hover-stroke)',
      cursor: 'pointer',
    });
  });

  it('should return active styles for "active" state', () => {
    const { result } = renderHook(() => useKeywordStyle('active' as CategoryState));

    expect(result.current).toMatchObject({
      position: 'relative',
      display: 'inline-block',
      transition: 'color 0.2s ease-in-out',
      color: 'transparent',
      WebkitTextStroke: '0.7px var(--color-category-hover-stroke)',
      cursor: 'pointer',
    });
  });

  it('should return disabled styles for "disabled" state', () => {
    const { result } = renderHook(() => useKeywordStyle('disabled' as CategoryState));

    expect(result.current).toMatchObject({
      position: 'relative',
      display: 'inline-block',
      transition: 'color 0.2s ease-in-out',
      color: 'var(--color-category-disabled)',
      cursor: 'default',
    });
  });

  it('should return base styles for unknown state', () => {
    const { result } = renderHook(() => useKeywordStyle('unknown' as CategoryState));

    expect(result.current).toMatchObject({
      position: 'relative',
      display: 'inline-block',
      transition: 'color 0.2s ease-in-out',
    });

    // Should not have state-specific styles
    expect(result.current.color).toBeUndefined();
    expect(result.current.cursor).toBeUndefined();
  });

  it('should have same styles for "hover" and "active" states', () => {
    const { result: hoverResult } = renderHook(() =>
      useKeywordStyle('hover' as CategoryState)
    );
    const { result: activeResult } = renderHook(() =>
      useKeywordStyle('active' as CategoryState)
    );

    expect(hoverResult.current).toEqual(activeResult.current);
  });

  it('should memoize result when state does not change', () => {
    const { result, rerender } = renderHook(() =>
      useKeywordStyle('clickable' as CategoryState)
    );

    const firstResult = result.current;
    rerender();
    const secondResult = result.current;

    // Should return same object reference
    expect(firstResult).toBe(secondResult);
  });

  it('should return new object when state changes', () => {
    const { result, rerender } = renderHook(
      ({ state }) => useKeywordStyle(state),
      { initialProps: { state: 'clickable' as CategoryState } }
    );

    const firstResult = result.current;

    rerender({ state: 'hover' as CategoryState });
    const secondResult = result.current;

    // Should return different object with different styles
    expect(firstResult).not.toBe(secondResult);
    expect(firstResult.color).not.toBe(secondResult.color);
  });
});
