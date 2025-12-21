// Tests for useCategorySelection hook

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCategorySelection } from '../../hooks/useCategorySelection';

describe('useCategorySelection', () => {
  it('should initialize with no selection', () => {
    const { result } = renderHook(() => useCategorySelection());

    expect(result.current.selectedCategory).toBeNull();
  });

  it('should select a sentence category', () => {
    const { result } = renderHook(() => useCategorySelection());

    act(() => {
      result.current.selectCategory('sentence', 'sentence1');
    });

    expect(result.current.selectedCategory).toEqual({
      type: 'sentence',
      id: 'sentence1',
    });
  });

  it('should select an exhibition category', () => {
    const { result } = renderHook(() => useCategorySelection());

    act(() => {
      result.current.selectCategory('exhibition', 'exhibition1');
    });

    expect(result.current.selectedCategory).toEqual({
      type: 'exhibition',
      id: 'exhibition1',
    });
  });

  it('should clear selection', () => {
    const { result } = renderHook(() => useCategorySelection());

    act(() => {
      result.current.selectCategory('sentence', 'sentence1');
    });

    expect(result.current.selectedCategory).not.toBeNull();

    act(() => {
      result.current.clearSelection();
    });

    expect(result.current.selectedCategory).toBeNull();
  });

  it('should check if category is selected (positive case)', () => {
    const { result } = renderHook(() => useCategorySelection());

    act(() => {
      result.current.selectCategory('sentence', 'sentence1');
    });

    expect(result.current.isCategorySelected('sentence', 'sentence1')).toBe(true);
  });

  it('should check if category is selected (wrong id)', () => {
    const { result } = renderHook(() => useCategorySelection());

    act(() => {
      result.current.selectCategory('sentence', 'sentence1');
    });

    expect(result.current.isCategorySelected('sentence', 'sentence2')).toBe(
      false
    );
  });

  it('should check if category is selected (wrong type)', () => {
    const { result } = renderHook(() => useCategorySelection());

    act(() => {
      result.current.selectCategory('sentence', 'sentence1');
    });

    expect(result.current.isCategorySelected('exhibition', 'sentence1')).toBe(
      false
    );
  });

  it('should check if category is selected when nothing is selected', () => {
    const { result } = renderHook(() => useCategorySelection());

    expect(result.current.isCategorySelected('sentence', 'sentence1')).toBe(
      false
    );
  });

  it('should replace selection when selecting a new category', () => {
    const { result } = renderHook(() => useCategorySelection());

    act(() => {
      result.current.selectCategory('sentence', 'sentence1');
    });

    expect(result.current.selectedCategory).toEqual({
      type: 'sentence',
      id: 'sentence1',
    });

    act(() => {
      result.current.selectCategory('exhibition', 'exhibition1');
    });

    expect(result.current.selectedCategory).toEqual({
      type: 'exhibition',
      id: 'exhibition1',
    });
    expect(result.current.isCategorySelected('sentence', 'sentence1')).toBe(
      false
    );
  });
});
