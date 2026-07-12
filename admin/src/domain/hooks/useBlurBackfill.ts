/**
 * 기존 업로드 이미지 LQIP 블러 백필 훅.
 *
 * `blurDataURL`이 없는 기존 작품 이미지들을 순회하며, 썸네일(없으면 원본) URL로부터
 * 블러 data URL을 생성해 Firestore 문서를 갱신한다.
 *
 * - 멱등(idempotent): 이미 `blurDataURL`이 있는 이미지는 건너뛴다 → 재실행 시 남은 것만 처리.
 * - graceful: 이미지별 생성 실패(CORS/로드 오류)나 작품별 저장 실패가 나도 전체를 멈추지 않고
 *   실패로 집계 후 계속 진행한다.
 */

import { useCallback, useRef, useState } from 'react';
import { getWorks, updateWork } from '../../data/repository';
import { generateBlurDataURLFromUrl } from '../../core/utils/image';
import { removeUndefinedValues } from '../../core/utils/object';
import type { WorkImage } from '../../core/types';

/** 이미지 로드/블러 생성 동시 실행 수 (한 번에 여러 원격 이미지를 병렬 처리) */
const BACKFILL_CONCURRENCY = 4;

export interface BlurBackfillProgress {
  /** 전체 작품 수 */
  totalWorks: number;
  /** 처리 완료한 작품 수 */
  processedWorks: number;
  /** 이미지가 갱신되어 저장된 작품 수 */
  worksUpdated: number;
  /** 블러가 새로 생성·저장된 이미지 수 */
  imagesUpdated: number;
  /** 블러 생성에 실패한 이미지 수 (CORS/로드/인코딩 실패) */
  imagesFailed: number;
  /** 저장(쓰기)에 실패한 작품 수 — 블러는 생성됐으나 Firestore 저장이 실패 */
  worksFailed: number;
  /** 현재 처리 중인 작품 제목 */
  currentTitle: string;
}

/**
 * items를 최대 limit개씩 동시 실행하며 fn을 적용하고, 입력 순서대로 결과를 반환한다.
 * (백필처럼 순서 보존이 필요한 독립 작업의 병렬화용)
 */
const mapWithConcurrency = async <T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> => {
  const results = new Array<R>(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      results[index] = await fn(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
};

interface UseBlurBackfillResult {
  isRunning: boolean;
  isDone: boolean;
  progress: BlurBackfillProgress;
  error: string | null;
  run: () => Promise<void>;
}

const INITIAL_PROGRESS: BlurBackfillProgress = {
  totalWorks: 0,
  processedWorks: 0,
  worksUpdated: 0,
  imagesUpdated: 0,
  imagesFailed: 0,
  worksFailed: 0,
  currentTitle: '',
};

/** 이미지에 블러 생성이 필요한지 (blurDataURL 없고, 소스 URL이 있음) */
const needsBlur = (img: WorkImage): boolean =>
  !img.blurDataURL && Boolean(img.thumbnailUrl || img.url);

export const useBlurBackfill = (): UseBlurBackfillResult => {
  const [isRunning, setIsRunning] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [progress, setProgress] = useState<BlurBackfillProgress>(INITIAL_PROGRESS);
  const [error, setError] = useState<string | null>(null);
  const runningRef = useRef(false);

  const run = useCallback(async () => {
    // 중복 실행 방지
    if (runningRef.current) return;
    runningRef.current = true;

    setIsRunning(true);
    setIsDone(false);
    setError(null);
    setProgress(INITIAL_PROGRESS);

    try {
      const works = await getWorks();
      setProgress((p) => ({ ...p, totalWorks: works.length }));

      for (const work of works) {
        setProgress((p) => ({ ...p, currentTitle: work.title }));

        const images = work.images ?? [];

        // 갱신할 이미지가 없으면 저장 없이 다음 작품으로
        if (!images.some(needsBlur)) {
          setProgress((p) => ({ ...p, processedWorks: p.processedWorks + 1 }));
          continue;
        }

        // 이미지들을 제한된 동시성으로 병렬 처리하되 원래 순서는 보존한다.
        const processed = await mapWithConcurrency(
          images,
          BACKFILL_CONCURRENCY,
          async (img): Promise<{ image: WorkImage; generated: boolean; failed: boolean }> => {
            if (!needsBlur(img)) {
              return { image: img, generated: false, failed: false };
            }
            const source = img.thumbnailUrl || img.url;
            const blur = await generateBlurDataURLFromUrl(source);
            if (blur) {
              return { image: { ...img, blurDataURL: blur }, generated: true, failed: false };
            }
            return { image: img, generated: false, failed: true };
          }
        );

        // Firestore는 undefined 값을 거부하므로 저장 직전 정제(WorkForm 저장 경로와 동일).
        const nextImages = processed.map((r) => removeUndefinedValues(r.image));
        const updatedCount = processed.filter((r) => r.generated).length;
        const failedCount = processed.filter((r) => r.failed).length;

        if (updatedCount > 0) {
          try {
            await updateWork(work.id, { images: nextImages });
            setProgress((p) => ({
              ...p,
              worksUpdated: p.worksUpdated + 1,
              imagesUpdated: p.imagesUpdated + updatedCount,
              imagesFailed: p.imagesFailed + failedCount,
              processedWorks: p.processedWorks + 1,
            }));
          } catch {
            // 저장(쓰기) 실패: 블러 생성은 성공했으므로 생성 실패(imagesFailed)와 구분해
            // worksFailed로 집계한다. (재실행 시 해당 작품만 다시 시도됨)
            setProgress((p) => ({
              ...p,
              imagesFailed: p.imagesFailed + failedCount,
              worksFailed: p.worksFailed + 1,
              processedWorks: p.processedWorks + 1,
            }));
          }
        } else {
          setProgress((p) => ({
            ...p,
            imagesFailed: p.imagesFailed + failedCount,
            processedWorks: p.processedWorks + 1,
          }));
        }
      }

      setIsDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : '백필 중 오류가 발생했습니다.');
    } finally {
      runningRef.current = false;
      setIsRunning(false);
      setProgress((p) => ({ ...p, currentTitle: '' }));
    }
  }, []);

  return { isRunning, isDone, progress, error, run };
};
