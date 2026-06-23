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
import { getWorks, updateWork } from '../../data/repository/worksRepository';
import { generateBlurDataURLFromUrl } from '../../core/utils/image';
import type { WorkImage } from '../../core/types';

export interface BlurBackfillProgress {
  /** 전체 작품 수 */
  totalWorks: number;
  /** 처리 완료한 작품 수 */
  processedWorks: number;
  /** 이미지가 갱신되어 저장된 작품 수 */
  worksUpdated: number;
  /** 블러가 새로 생성·저장된 이미지 수 */
  imagesUpdated: number;
  /** 블러 생성/저장에 실패한 이미지 수 */
  imagesFailed: number;
  /** 현재 처리 중인 작품 제목 */
  currentTitle: string;
}

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

        let updatedCount = 0;
        let failedCount = 0;
        const nextImages: WorkImage[] = [];

        for (const img of images) {
          if (!needsBlur(img)) {
            nextImages.push(img);
            continue;
          }
          const source = img.thumbnailUrl || img.url;
          const blur = await generateBlurDataURLFromUrl(source);
          if (blur) {
            nextImages.push({ ...img, blurDataURL: blur });
            updatedCount += 1;
          } else {
            nextImages.push(img);
            failedCount += 1;
          }
        }

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
            // 저장 실패: 생성했던 것까지 실패로 집계
            setProgress((p) => ({
              ...p,
              imagesFailed: p.imagesFailed + updatedCount + failedCount,
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
