import { describe, it, expect, vi } from 'vitest';
import type { Work, WorkImage } from '../../../core/types';

// Firebase 모킹 — 검증 실패는 addDoc 이전에 발생하므로 모듈 로드만 통과시키면 됨
vi.mock('../../../data/api/client', () => ({ db: {} }));
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({})),
  doc: vi.fn(() => ({})),
  getDocs: vi.fn(),
  getDoc: vi.fn(async () => ({ data: () => ({}) })),
  addDoc: vi.fn(async () => ({ id: 'new-id' })),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  where: vi.fn(),
  limit: vi.fn(),
  startAfter: vi.fn(),
  serverTimestamp: vi.fn(() => 'ts'),
}));

import { createWork } from '../../../data/api/worksApi';
import { ValidationError } from '../../../core/errors';

const makeImage = (caption?: string): WorkImage => ({
  id: 'img-1',
  url: 'https://example.com/a.jpg',
  thumbnailUrl: 'https://example.com/a-t.jpg',
  order: 0,
  width: 800,
  height: 600,
  ...(caption !== undefined ? { caption } : {}),
});

const makeWork = (images: WorkImage[]): Omit<Work, 'id' | 'createdAt' | 'updatedAt'> => ({
  title: 'Test',
  thumbnailImageId: 'img-1',
  images,
  videos: [],
  sentenceCategoryIds: [],
  exhibitionCategoryIds: [],
  isPublished: false,
});

describe('worksApi 이미지 캡션 검증', () => {
  it('이미지 캡션이 200자를 초과하면 ValidationError(IMAGE_CAPTION_TOO_LONG)', async () => {
    const work = makeWork([makeImage('x'.repeat(201))]);
    await expect(createWork(work)).rejects.toMatchObject({
      name: 'ValidationError',
      code: 'IMAGE_CAPTION_TOO_LONG',
    });
  });

  it('이미지 캡션이 200자 이하이면 캡션 검증을 통과한다', async () => {
    const work = makeWork([makeImage('x'.repeat(200))]);
    // 검증 통과 → 모킹된 Firebase 경로로 정상 resolve
    await expect(createWork(work)).resolves.toBeDefined();
  });

  it('캡션이 없는 이미지는 검증을 통과한다', async () => {
    const work = makeWork([makeImage(undefined)]);
    await expect(createWork(work)).resolves.toBeDefined();
  });
});

// ValidationError 임을 함께 보장
describe('worksApi 이미지 캡션 검증 - 에러 타입', () => {
  it('초과 시 던져지는 에러는 ValidationError 인스턴스', async () => {
    const work = makeWork([makeImage('x'.repeat(201))]);
    await createWork(work).catch((e) => {
      expect(e).toBeInstanceOf(ValidationError);
    });
  });
});
