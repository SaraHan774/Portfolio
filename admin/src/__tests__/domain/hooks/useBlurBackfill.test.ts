import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('../../../data/repository/worksRepository', () => ({
  getWorks: vi.fn(),
  updateWork: vi.fn(),
}));
vi.mock('../../../core/utils/image', () => ({
  generateBlurDataURLFromUrl: vi.fn(),
}));

import { useBlurBackfill } from '../../../domain/hooks/useBlurBackfill';
import { getWorks, updateWork } from '../../../data/repository/worksRepository';
import { generateBlurDataURLFromUrl } from '../../../core/utils/image';
import type { Work, WorkImage } from '../../../core/types';

const mockGetWorks = vi.mocked(getWorks);
const mockUpdateWork = vi.mocked(updateWork);
const mockGen = vi.mocked(generateBlurDataURLFromUrl);

const makeImage = (overrides: Partial<WorkImage>): WorkImage => ({
  id: 'img',
  url: 'https://cdn/o.jpg',
  thumbnailUrl: 'https://cdn/t.jpg',
  order: 1,
  width: 100,
  height: 100,
  ...overrides,
});

const makeWork = (id: string, images: WorkImage[]): Work =>
  ({ id, title: `work-${id}`, images } as unknown as Work);

const runHook = async () => {
  const { result } = renderHook(() => useBlurBackfill());
  await act(async () => {
    await result.current.run();
  });
  return result;
};

beforeEach(() => {
  vi.clearAllMocks();
  mockUpdateWork.mockResolvedValue({} as Work);
});

describe('useBlurBackfill', () => {
  it('blurDataURL이 없는 이미지에만 블러를 생성해 저장한다', async () => {
    const imgA = makeImage({ id: 'a' }); // 블러 없음 → 생성 대상
    const imgB = makeImage({ id: 'b', blurDataURL: 'data:existing' }); // 이미 있음 → 건너뜀
    mockGetWorks.mockResolvedValue([makeWork('w1', [imgA, imgB])]);
    mockGen.mockResolvedValue('data:newblur');

    const result = await runHook();

    // 갱신 대상 이미지에 대해서만 생성 호출
    expect(mockGen).toHaveBeenCalledTimes(1);
    expect(mockGen).toHaveBeenCalledWith(imgA.thumbnailUrl);

    // updateWork는 병합된 images로 1회 호출
    expect(mockUpdateWork).toHaveBeenCalledTimes(1);
    const [, updates] = mockUpdateWork.mock.calls[0];
    expect(updates.images?.[0]).toMatchObject({ id: 'a', blurDataURL: 'data:newblur' });
    expect(updates.images?.[1]).toMatchObject({ id: 'b', blurDataURL: 'data:existing' });

    expect(result.current.progress.imagesUpdated).toBe(1);
    expect(result.current.progress.worksUpdated).toBe(1);
    expect(result.current.progress.imagesFailed).toBe(0);
    expect(result.current.isDone).toBe(true);
  });

  it('모든 이미지에 이미 블러가 있으면 저장하지 않는다(멱등)', async () => {
    mockGetWorks.mockResolvedValue([
      makeWork('w1', [makeImage({ id: 'a', blurDataURL: 'data:x' })]),
    ]);

    const result = await runHook();

    expect(mockGen).not.toHaveBeenCalled();
    expect(mockUpdateWork).not.toHaveBeenCalled();
    expect(result.current.progress.imagesUpdated).toBe(0);
    expect(result.current.progress.processedWorks).toBe(1);
    expect(result.current.isDone).toBe(true);
  });

  it('블러 생성 실패(빈 문자열)는 실패로 집계하고 저장하지 않는다', async () => {
    mockGetWorks.mockResolvedValue([makeWork('w1', [makeImage({ id: 'a' })])]);
    mockGen.mockResolvedValue(''); // CORS/로드 실패 시뮬레이션

    const result = await runHook();

    expect(mockUpdateWork).not.toHaveBeenCalled();
    expect(result.current.progress.imagesFailed).toBe(1);
    expect(result.current.progress.imagesUpdated).toBe(0);
    expect(result.current.isDone).toBe(true);
  });
});
