// Tests for usePrefetchFirstImage — 비용 제어(첫 1장·중복차단·saveData 가드) 검증

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  usePrefetchFirstImage,
  __resetPrefetchedKeysForTest,
} from '../../hooks/usePrefetchFirstImage';
import type { Work } from '@/core/types';

function makeWork(id: string, images: Array<{ id: string; url: string; order: number }>): Work {
  return {
    id,
    title: `Work ${id}`,
    fullDescription: '',
    thumbnailImageId: images[0]?.id ?? '',
    images: images.map((img) => ({
      id: img.id,
      url: img.url,
      thumbnailUrl: `${img.url}-thumb`,
      width: 800,
      height: 600,
      order: img.order,
    })),
    sentenceCategoryIds: [],
    exhibitionCategoryIds: [],
    isPublished: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/** document.head 의 prefetch link 개수 */
function countPrefetchLinks(): number {
  return document.head.querySelectorAll('link[rel="prefetch"][as="image"]').length;
}

describe('usePrefetchFirstImage', () => {
  beforeEach(() => {
    __resetPrefetchedKeysForTest();
    document.head.querySelectorAll('link[rel="prefetch"]').forEach((l) => l.remove());
    // 기본: 네트워크 제약 없음
    Object.defineProperty(navigator, 'connection', {
      configurable: true,
      value: { saveData: false, effectiveType: '4g' },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('첫 이미지(order 최소) 변형을 prefetch 한다', () => {
    const { result } = renderHook(() => usePrefetchFirstImage());
    const work = makeWork('w1', [
      { id: 'b', url: 'https://cdn/b.jpg', order: 2 },
      { id: 'a', url: 'https://cdn/a.jpg', order: 0 },
    ]);

    result.current(work);

    expect(countPrefetchLinks()).toBe(1);
    const link = document.head.querySelector('link[rel="prefetch"][as="image"]');
    const srcset = link?.getAttribute('imagesrcset') ?? link?.getAttribute('href') ?? '';
    // order 최소(a.jpg)가 선택되고 q=72로 next/image 요청과 일치해야 한다
    expect(srcset).toContain(encodeURIComponent('https://cdn/a.jpg'));
    expect(srcset).toContain('q=72');
    expect(srcset).not.toContain(encodeURIComponent('https://cdn/b.jpg'));
  });

  it('동일 작품 첫 이미지는 중복 발사하지 않는다', () => {
    const { result } = renderHook(() => usePrefetchFirstImage());
    const work = makeWork('w1', [{ id: 'a', url: 'https://cdn/a.jpg', order: 0 }]);

    result.current(work);
    result.current(work);
    result.current(work);

    expect(countPrefetchLinks()).toBe(1);
  });

  it('saveData=true 면 prefetch 하지 않는다', () => {
    Object.defineProperty(navigator, 'connection', {
      configurable: true,
      value: { saveData: true, effectiveType: '4g' },
    });
    const { result } = renderHook(() => usePrefetchFirstImage());
    result.current(makeWork('w1', [{ id: 'a', url: 'https://cdn/a.jpg', order: 0 }]));

    expect(countPrefetchLinks()).toBe(0);
  });

  it('effectiveType 2g/slow-2g 면 prefetch 하지 않는다', () => {
    Object.defineProperty(navigator, 'connection', {
      configurable: true,
      value: { saveData: false, effectiveType: '2g' },
    });
    const { result } = renderHook(() => usePrefetchFirstImage());
    result.current(makeWork('w1', [{ id: 'a', url: 'https://cdn/a.jpg', order: 0 }]));

    expect(countPrefetchLinks()).toBe(0);
  });

  it('이미지가 없는 작품은 무시한다', () => {
    const { result } = renderHook(() => usePrefetchFirstImage());
    result.current(makeWork('w1', []));

    expect(countPrefetchLinks()).toBe(0);
  });
});
