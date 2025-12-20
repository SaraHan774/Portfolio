// Tests for useWorkSelection hook

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWorkSelection } from '../../hooks/useWorkSelection';
import type { Work } from '@/core/types';

const mockWork: Work = {
  id: 'work1',
  title: 'Test Work',
  year: 2024,
  description: 'Test description',
  images: [],
  sentenceCategoryIds: [],
  exhibitionCategoryIds: [],
  isPublished: true,
  publishedAt: new Date('2024-01-01'),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

describe('useWorkSelection', () => {
  it('should initialize with no selection', () => {
    const { result } = renderHook(() => useWorkSelection());

    expect(result.current.selectedWork).toBeNull();
    expect(result.current.hoveredWorkId).toBeNull();
  });

  it('should select a work', () => {
    const { result } = renderHook(() => useWorkSelection());

    act(() => {
      result.current.selectWork(mockWork);
    });

    expect(result.current.selectedWork).toEqual(mockWork);
  });

  it('should clear selection when null is passed', () => {
    const { result } = renderHook(() => useWorkSelection());

    act(() => {
      result.current.selectWork(mockWork);
    });

    expect(result.current.selectedWork).toEqual(mockWork);

    act(() => {
      result.current.selectWork(null);
    });

    expect(result.current.selectedWork).toBeNull();
  });

  it('should check if work is selected', () => {
    const { result } = renderHook(() => useWorkSelection());

    act(() => {
      result.current.selectWork(mockWork);
    });

    expect(result.current.isWorkSelected('work1')).toBe(true);
    expect(result.current.isWorkSelected('work2')).toBe(false);
  });

  it('should set hovered work id', () => {
    const { result } = renderHook(() => useWorkSelection());

    act(() => {
      result.current.setHoveredWorkId('work1');
    });

    expect(result.current.hoveredWorkId).toBe('work1');
  });

  it('should check if work is hovered', () => {
    const { result } = renderHook(() => useWorkSelection());

    act(() => {
      result.current.setHoveredWorkId('work1');
    });

    expect(result.current.isWorkHovered('work1')).toBe(true);
    expect(result.current.isWorkHovered('work2')).toBe(false);
  });

  it('should clear hover when null is passed', () => {
    const { result } = renderHook(() => useWorkSelection());

    act(() => {
      result.current.setHoveredWorkId('work1');
    });

    expect(result.current.hoveredWorkId).toBe('work1');

    act(() => {
      result.current.setHoveredWorkId(null);
    });

    expect(result.current.hoveredWorkId).toBeNull();
  });

  it('should maintain selection and hover independently', () => {
    const { result } = renderHook(() => useWorkSelection());

    act(() => {
      result.current.selectWork(mockWork);
      result.current.setHoveredWorkId('work2');
    });

    expect(result.current.selectedWork).toEqual(mockWork);
    expect(result.current.hoveredWorkId).toBe('work2');
    expect(result.current.isWorkSelected('work1')).toBe(true);
    expect(result.current.isWorkHovered('work2')).toBe(true);
  });
});
