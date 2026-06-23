import { describe, it, expect } from 'vitest';
import { mergeUploadedImages } from '../../../core/utils/imageUploadMerge';
import type { WorkImage } from '../../../core/types';

const tempImage = (id: string, caption?: string): WorkImage => ({
  id,
  url: 'blob:preview',
  thumbnailUrl: 'blob:preview',
  order: 1,
  width: 0,
  height: 0,
  ...(caption !== undefined ? { caption } : {}),
});

const uploadedImage = (id: string, blurDataURL?: string): WorkImage => ({
  id,
  url: `https://cdn/${id}.jpg`,
  thumbnailUrl: `https://cdn/${id}-t.jpg`,
  order: 1,
  width: 800,
  height: 600,
  ...(blurDataURL !== undefined ? { blurDataURL } : {}),
});

describe('mergeUploadedImages', () => {
  it('🔴 회귀: 신규 업로드 이미지의 caption이 업로드 결과 병합 후에도 보존된다', () => {
    const temp = tempImage('pending-1', '사진_XXX');
    const real = uploadedImage('real-1');
    const uploadedMap = new Map([['pending-1', real]]);

    const { images } = mergeUploadedImages([temp], uploadedMap, new Set(), 'pending-1');

    expect(images).toHaveLength(1);
    // 실제 업로드 결과 URL로 교체되었지만 caption은 temp에서 승계
    expect(images[0].url).toBe('https://cdn/real-1.jpg');
    expect(images[0].caption).toBe('사진_XXX');
  });

  it('caption이 없는 신규 이미지는 caption이 undefined로 유지된다', () => {
    const temp = tempImage('pending-1');
    const uploadedMap = new Map([['pending-1', uploadedImage('real-1')]]);

    const { images } = mergeUploadedImages([temp], uploadedMap, new Set(), 'pending-1');

    expect(images[0].caption).toBeUndefined();
  });

  it('이미 업로드된(교체 대상 아님) 이미지의 caption은 그대로 유지된다', () => {
    const existing: WorkImage = { ...uploadedImage('real-existing'), caption: '기존캡션' };
    const { images } = mergeUploadedImages([existing], new Map(), new Set(), 'real-existing');

    expect(images[0].caption).toBe('기존캡션');
  });

  it('업로드 실패한 이미지는 제거되고 order가 재정렬된다', () => {
    const ok = tempImage('p-ok', 'A');
    const fail = tempImage('p-fail', 'B');
    const uploadedMap = new Map([['p-ok', uploadedImage('real-ok')]]);
    const failed = new Set(['p-fail']);

    const { images } = mergeUploadedImages([ok, fail], uploadedMap, failed, 'p-ok');

    expect(images).toHaveLength(1);
    expect(images[0].caption).toBe('A');
    expect(images[0].order).toBe(1);
  });

  it('업로드 결과의 blurDataURL(LQIP)이 병합 후에도 보존된다', () => {
    const temp = tempImage('pending-1', 'cap');
    const real = uploadedImage('real-1', 'data:image/webp;base64,AAAA');
    const uploadedMap = new Map([['pending-1', real]]);

    const { images } = mergeUploadedImages([temp], uploadedMap, new Set(), 'pending-1');

    expect(images[0].blurDataURL).toBe('data:image/webp;base64,AAAA');
    // caption도 동시에 승계되는지 회귀 확인
    expect(images[0].caption).toBe('cap');
  });

  it('썸네일이 temp였다면 실제 ID로 교체된다', () => {
    const temp = tempImage('pending-1', 'cap');
    const uploadedMap = new Map([['pending-1', uploadedImage('real-1')]]);

    const { thumbnailId } = mergeUploadedImages([temp], uploadedMap, new Set(), 'pending-1');

    expect(thumbnailId).toBe('real-1');
  });
});
