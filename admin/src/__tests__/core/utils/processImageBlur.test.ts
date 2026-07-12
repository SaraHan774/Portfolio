import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { processImage, getOutputExtension } from '../../../core/utils/image';

/**
 * processImage의 LQIP(blurDataURL) 생성 경로 테스트.
 *
 * jsdom에는 실제 canvas 인코딩이 없으므로 Image / canvas API를 모킹하여
 * - 상한 이하 data URL을 반환하는지
 * - data URL이 과도하게 크면 재시도 후 빈 문자열로 graceful 처리하는지
 * 를 검증한다.
 */

const PNG_TYPE = 'image/png';

// toDataURL이 반환할 값을 테스트마다 제어
let dataURLValue = 'data:image/webp;base64,SHORT';

beforeEach(() => {
  // URL object helpers
  vi.stubGlobal('URL', {
    createObjectURL: vi.fn(() => 'blob:mock'),
    revokeObjectURL: vi.fn(),
  });

  // Image 모킹: src 설정 시 즉시 onload 호출
  class MockImage {
    width = 1600;
    height = 1200;
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    set src(_v: string) {
      // microtask 후 onload 트리거
      Promise.resolve().then(() => this.onload?.());
    }
  }
  vi.stubGlobal('Image', MockImage as unknown as typeof Image);

  // canvas getContext/toDataURL/toBlob 모킹
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
    () => ({ drawImage: vi.fn() }) as unknown as CanvasRenderingContext2D
  );
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockImplementation(
    () => dataURLValue
  );
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (
    this: HTMLCanvasElement,
    cb: BlobCallback
  ) {
    cb(new Blob(['x'], { type: 'image/webp' }));
  } as HTMLCanvasElement['toBlob']);

  // supportsWebP()의 모듈 캐시(_supportsWebP)를 정상 toDataURL로 미리 확정한다.
  // 이렇게 하지 않으면, toDataURL을 throw로 덮어쓰는 테스트가 '먼저' 실행될 때
  // webp 프로브까지 실패해 무관한 경로가 깨지는 순서 의존이 생긴다.
  getOutputExtension();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const createFile = (): File => new File([new Blob([''], { type: PNG_TYPE })], 'a.png', { type: PNG_TYPE });

const baseOptions = {
  thumbnail: { maxWidth: 300, maxHeight: 300, quality: 0.7 },
};

describe('processImage - blurDataURL(LQIP)', () => {
  it('상한 이하 data URL을 blurDataURL로 반환한다', async () => {
    dataURLValue = 'data:image/webp;base64,' + 'A'.repeat(500);
    const result = await processImage(createFile(), baseOptions);

    expect(result.blurDataURL).toBe(dataURLValue);
    expect(result.blurDataURL.length).toBeLessThanOrEqual(2048);
  });

  it('LQIP를 ~20px 상자로 축소해 인코딩한다(비율 유지, WebP, quality 0.5)', async () => {
    dataURLValue = 'data:image/webp;base64,' + 'A'.repeat(300);
    const calls: Array<{ w: number; h: number; type: unknown; quality: unknown }> = [];
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockImplementation(function (
      this: HTMLCanvasElement,
      type?: unknown,
      quality?: unknown
    ) {
      calls.push({ w: this.width, h: this.height, type, quality });
      return dataURLValue;
    } as unknown as HTMLCanvasElement['toDataURL']);

    // MockImage는 1600x1200 → 20px 상자에 비율 유지 축소 시 20x15
    await processImage(createFile(), baseOptions);

    const lqip = calls.find((c) => c.quality === 0.5);
    expect(lqip).toBeDefined();
    expect(lqip!.w).toBe(20);
    expect(lqip!.h).toBe(15);
    expect(lqip!.type).toBe('image/webp');
  });

  it('data URL이 상한을 항상 초과하면 빈 문자열로 graceful 처리한다', async () => {
    // 모든 인코딩 시도에서 상한 초과(2048자 초과)
    dataURLValue = 'data:image/webp;base64,' + 'A'.repeat(5000);
    const result = await processImage(createFile(), baseOptions);

    expect(result.blurDataURL).toBe('');
  });

  it('인코딩 중 오류가 나도 throw하지 않고 빈 문자열을 반환한다', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockImplementation(() => {
      throw new Error('encode fail');
    });
    const result = await processImage(createFile(), baseOptions);

    expect(result.blurDataURL).toBe('');
    // 나머지 결과는 정상
    expect(result.thumbnail).toBeInstanceOf(Blob);
  });
});
