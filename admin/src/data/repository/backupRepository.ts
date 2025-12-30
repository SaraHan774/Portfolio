// 백업/복원 Repository
import { doc, setDoc, writeBatch, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { createBackup, validateBackupData, downloadBackupFile } from '../api/backupApi';
import type { BackupData, RestoreOptions, Work, SentenceCategory, ExhibitionCategory, SiteSettings } from '../../core/types';

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
      } catch (error) {
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
const restoreWorks = async (works: Work[], _conflictStrategy: 'overwrite' | 'skip' | 'merge'): Promise<void> => {
  const batch = writeBatch(db);

  for (const work of works) {
    const workRef = doc(db, 'works', work.id);

    // Date 객체를 Timestamp로 변환
    const workData = {
      ...work,
      createdAt: Timestamp.fromDate(new Date(work.createdAt)),
      updatedAt: Timestamp.fromDate(new Date(work.updatedAt)),
      publishedAt: work.publishedAt ? Timestamp.fromDate(new Date(work.publishedAt)) : null,
    };

    // conflict strategy에 따라 처리 (현재는 모두 덮어쓰기)
    batch.set(workRef, workData);
  }

  await batch.commit();
};

/**
 * Sentence Categories 복원
 */
const restoreSentenceCategories = async (
  categories: SentenceCategory[],
  _conflictStrategy: 'overwrite' | 'skip' | 'merge'
): Promise<void> => {
  const batch = writeBatch(db);

  for (const category of categories) {
    const categoryRef = doc(db, 'sentenceCategories', category.id);

    const categoryData = {
      ...category,
      createdAt: Timestamp.fromDate(new Date(category.createdAt)),
      updatedAt: Timestamp.fromDate(new Date(category.updatedAt)),
    };

    batch.set(categoryRef, categoryData);
  }

  await batch.commit();
};

/**
 * Exhibition Categories 복원
 */
const restoreExhibitionCategories = async (
  categories: ExhibitionCategory[],
  _conflictStrategy: 'overwrite' | 'skip' | 'merge'
): Promise<void> => {
  const batch = writeBatch(db);

  for (const category of categories) {
    const categoryRef = doc(db, 'exhibitionCategories', category.id);

    const categoryData = {
      ...category,
      createdAt: Timestamp.fromDate(new Date(category.createdAt)),
      updatedAt: Timestamp.fromDate(new Date(category.updatedAt)),
    };

    batch.set(categoryRef, categoryData);
  }

  await batch.commit();
};

/**
 * Settings 복원
 */
const restoreSettings = async (
  settings: SiteSettings,
  _conflictStrategy: 'overwrite' | 'skip' | 'merge'
): Promise<void> => {
  const settingsRef = doc(db, 'settings', settings.id);

  const settingsData = {
    ...settings,
    updatedAt: Timestamp.fromDate(new Date(settings.updatedAt)),
  };

  await setDoc(settingsRef, settingsData);
};

/**
 * 백업 데이터 복원
 */
export const restoreBackupData = async (backup: BackupData, options: RestoreOptions): Promise<void> => {
  const promises: Promise<void>[] = [];

  if (options.restoreWorks && backup.data.works.length > 0) {
    promises.push(restoreWorks(backup.data.works, options.conflictStrategy));
  }

  if (options.restoreSentenceCategories && backup.data.sentenceCategories.length > 0) {
    promises.push(restoreSentenceCategories(backup.data.sentenceCategories, options.conflictStrategy));
  }

  if (options.restoreExhibitionCategories && backup.data.exhibitionCategories.length > 0) {
    promises.push(restoreExhibitionCategories(backup.data.exhibitionCategories, options.conflictStrategy));
  }

  if (options.restoreSettings) {
    promises.push(restoreSettings(backup.data.settings, options.conflictStrategy));
  }

  await Promise.all(promises);
};
