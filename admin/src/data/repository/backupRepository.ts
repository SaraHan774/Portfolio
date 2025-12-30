// 백업/복원 Repository
import { doc, setDoc, writeBatch, Timestamp } from 'firebase/firestore';
import DOMPurify from 'dompurify';
import { db } from '../../config/firebase';
import { createBackup, validateBackupData, downloadBackupFile } from '../api/backupApi';
import { ValidationError } from '../../core/errors';
import type { BackupData, RestoreOptions, Work, SentenceCategory, ExhibitionCategory, SiteSettings } from '../../core/types';

/**
 * 부분 복원 실패 정보
 */
interface PartialFailureInfo {
  failed: string;
  total: number;
  succeeded: number;
}

// 전역 부분 복원 실패 상태 (React Query mutation 간 공유용)
let partialFailureState: PartialFailureInfo | null = null;

/**
 * 부분 복원 실패 정보 설정
 */
export const setPartialFailure = (info: PartialFailureInfo | null): void => {
  partialFailureState = info;
};

/**
 * 부분 복원 실패 정보 가져오기 및 초기화
 */
export const getAndClearPartialFailure = (): PartialFailureInfo | null => {
  const info = partialFailureState;
  partialFailureState = null;
  return info;
};

/**
 * Work 데이터 검증 및 정제
 */
const sanitizeWork = (work: Work): Work => {
  // ID 형식 검증 (인젝션 방지)
  if (!/^[a-zA-Z0-9_-]+$/.test(work.id)) {
    throw new ValidationError('유효하지 않은 작업 ID입니다.', 'INVALID_WORK_ID');
  }

  return {
    ...work,
    title: DOMPurify.sanitize(work.title, { ALLOWED_TAGS: [] }), // 순수 텍스트만
    caption: work.caption ? DOMPurify.sanitize(work.caption) : undefined,
    images: (work.images || []).slice(0, 50), // 배열 크기 제한
    videos: (work.videos || []).slice(0, 10),
    sentenceCategoryIds: (work.sentenceCategoryIds || []).slice(0, 20),
    exhibitionCategoryIds: (work.exhibitionCategoryIds || []).slice(0, 20),
  };
};

/**
 * SentenceCategory 데이터 검증 및 정제
 */
const sanitizeSentenceCategory = (category: SentenceCategory): SentenceCategory => {
  if (!/^[a-zA-Z0-9_-]+$/.test(category.id)) {
    throw new ValidationError('유효하지 않은 카테고리 ID입니다.', 'INVALID_CATEGORY_ID');
  }

  return {
    ...category,
    sentence: DOMPurify.sanitize(category.sentence, { ALLOWED_TAGS: [] }),
    keywords: (category.keywords || []).slice(0, 10),
  };
};

/**
 * ExhibitionCategory 데이터 검증 및 정제
 */
const sanitizeExhibitionCategory = (category: ExhibitionCategory): ExhibitionCategory => {
  if (!/^[a-zA-Z0-9_-]+$/.test(category.id)) {
    throw new ValidationError('유효하지 않은 카테고리 ID입니다.', 'INVALID_CATEGORY_ID');
  }

  return {
    ...category,
    title: DOMPurify.sanitize(category.title, { ALLOWED_TAGS: [] }),
    workOrders: (category.workOrders || []).slice(0, 100),
  };
};

/**
 * 백업 생성 및 다운로드
 */
export const createAndDownloadBackup = async (): Promise<void> => {
  const backup = await createBackup();

  // 파일 크기 계산
  const jsonString = JSON.stringify(backup);
  backup.metadata.totalSize = new Blob([jsonString]).size;

  downloadBackupFile(backup);
};

/**
 * JSON 파일에서 백업 데이터 읽기
 */
export const readBackupFile = (file: File): Promise<BackupData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        if (!validateBackupData(data)) {
          reject(new Error('유효하지 않은 백업 파일 형식입니다.'));
          return;
        }

        resolve(data);
      } catch {
        reject(new Error('백업 파일을 읽을 수 없습니다.'));
      }
    };

    reader.onerror = () => {
      reject(new Error('파일 읽기에 실패했습니다.'));
    };

    reader.readAsText(file);
  });
};

/**
 * Works 복원
 */
const restoreWorks = async (works: Work[]): Promise<void> => {
  const batch = writeBatch(db);

  for (const work of works) {
    // 데이터 검증 및 정제
    const sanitizedWork = sanitizeWork(work);

    const workRef = doc(db, 'works', sanitizedWork.id);

    // Date 객체를 Timestamp로 변환
    const workData = {
      ...sanitizedWork,
      createdAt: Timestamp.fromDate(new Date(sanitizedWork.createdAt)),
      updatedAt: Timestamp.fromDate(new Date(sanitizedWork.updatedAt)),
      publishedAt: sanitizedWork.publishedAt ? Timestamp.fromDate(new Date(sanitizedWork.publishedAt)) : null,
    };

    batch.set(workRef, workData);
  }

  await batch.commit();
};

/**
 * Sentence Categories 복원
 */
const restoreSentenceCategories = async (categories: SentenceCategory[]): Promise<void> => {
  const batch = writeBatch(db);

  for (const category of categories) {
    // 데이터 검증 및 정제
    const sanitizedCategory = sanitizeSentenceCategory(category);

    const categoryRef = doc(db, 'sentenceCategories', sanitizedCategory.id);

    const categoryData = {
      ...sanitizedCategory,
      createdAt: Timestamp.fromDate(new Date(sanitizedCategory.createdAt)),
      updatedAt: Timestamp.fromDate(new Date(sanitizedCategory.updatedAt)),
    };

    batch.set(categoryRef, categoryData);
  }

  await batch.commit();
};

/**
 * Exhibition Categories 복원
 */
const restoreExhibitionCategories = async (categories: ExhibitionCategory[]): Promise<void> => {
  const batch = writeBatch(db);

  for (const category of categories) {
    // 데이터 검증 및 정제
    const sanitizedCategory = sanitizeExhibitionCategory(category);

    const categoryRef = doc(db, 'exhibitionCategories', sanitizedCategory.id);

    const categoryData = {
      ...sanitizedCategory,
      createdAt: Timestamp.fromDate(new Date(sanitizedCategory.createdAt)),
      updatedAt: Timestamp.fromDate(new Date(sanitizedCategory.updatedAt)),
    };

    batch.set(categoryRef, categoryData);
  }

  await batch.commit();
};

/**
 * SiteSettings 데이터 검증 및 정제
 */
const sanitizeSiteSettings = (settings: SiteSettings): SiteSettings => {
  if (!/^[a-zA-Z0-9_-]+$/.test(settings.id)) {
    throw new ValidationError('유효하지 않은 설정 ID입니다.', 'INVALID_SETTINGS_ID');
  }

  return {
    ...settings,
    browserTitle: DOMPurify.sanitize(settings.browserTitle, { ALLOWED_TAGS: [] }),
    browserDescription: DOMPurify.sanitize(settings.browserDescription, { ALLOWED_TAGS: [] }),
    footerText: DOMPurify.sanitize(settings.footerText, { ALLOWED_TAGS: [] }),
  };
};

/**
 * Settings 복원
 */
const restoreSettings = async (settings: SiteSettings): Promise<void> => {
  // 데이터 검증 및 정제
  const sanitizedSettings = sanitizeSiteSettings(settings);

  const settingsRef = doc(db, 'settings', sanitizedSettings.id);

  const settingsData = {
    ...sanitizedSettings,
    updatedAt: Timestamp.fromDate(new Date(sanitizedSettings.updatedAt)),
  };

  await setDoc(settingsRef, settingsData);
};

/**
 * 백업 데이터 복원
 * Promise.allSettled 사용으로 부분 복원 실패 시에도 나머지 항목은 복원됨
 */
export const restoreBackupData = async (backup: BackupData, options: RestoreOptions): Promise<void> => {
  const tasks: Array<{ name: string; promise: Promise<void> }> = [];

  if (options.restoreWorks && backup.data.works.length > 0) {
    tasks.push({ name: 'Works', promise: restoreWorks(backup.data.works) });
  }

  if (options.restoreSentenceCategories && backup.data.sentenceCategories.length > 0) {
    tasks.push({ name: 'Sentence Categories', promise: restoreSentenceCategories(backup.data.sentenceCategories) });
  }

  if (options.restoreExhibitionCategories && backup.data.exhibitionCategories.length > 0) {
    tasks.push({ name: 'Exhibition Categories', promise: restoreExhibitionCategories(backup.data.exhibitionCategories) });
  }

  if (options.restoreSettings) {
    tasks.push({ name: 'Settings', promise: restoreSettings(backup.data.settings) });
  }

  // Promise.allSettled로 부분 실패 처리
  const results = await Promise.allSettled(tasks.map((task) => task.promise));

  // 실패한 항목 수집
  const failures: Array<{ name: string; error: unknown }> = [];
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      failures.push({
        name: tasks[index].name,
        error: result.reason,
      });
    }
  });

  // 모든 항목이 실패한 경우 에러 throw
  if (failures.length === tasks.length) {
    const errorMessages = failures.map((f) => `${f.name}: ${f.error}`).join('\n');
    throw new Error(`모든 데이터 복원에 실패했습니다.\n${errorMessages}`);
  }

  // 일부 항목이 실패한 경우 경고 (throw하지 않음)
  if (failures.length > 0) {
    const failedNames = failures.map((f) => f.name).join(', ');
    console.warn(`일부 데이터 복원 실패: ${failedNames}`);
    // 부분 복원 성공 시 사용자에게 알림을 위해 상태 저장
    setPartialFailure({
      failed: failedNames,
      total: tasks.length,
      succeeded: tasks.length - failures.length,
    });
  }
};
