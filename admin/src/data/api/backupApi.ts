// 데이터 백업 및 복원 API
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import type { Work, SentenceCategory, ExhibitionCategory, SiteSettings, BackupData } from '../../core/types';

/**
 * 모든 Works 조회
 */
const fetchAllWorksForBackup = async (): Promise<Work[]> => {
  const worksRef = collection(db, 'works');
  const snapshot = await getDocs(worksRef);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      title: data.title,
      year: data.year,
      thumbnailImageId: data.thumbnailImageId,
      images: data.images || [],
      videos: data.videos || [],
      caption: data.caption,
      sentenceCategoryIds: data.sentenceCategoryIds || [],
      exhibitionCategoryIds: data.exhibitionCategoryIds || [],
      isPublished: data.isPublished,
      viewCount: data.viewCount || 0,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      publishedAt: data.publishedAt?.toDate(),
    } as Work;
  });
};

/**
 * 모든 Sentence Categories 조회
 */
const fetchAllSentenceCategoriesForBackup = async (): Promise<SentenceCategory[]> => {
  const categoriesRef = collection(db, 'sentenceCategories');
  const snapshot = await getDocs(categoriesRef);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      sentence: data.sentence,
      keywords: data.keywords || [],
      displayOrder: data.displayOrder,
      isActive: data.isActive,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as SentenceCategory;
  });
};

/**
 * 모든 Exhibition Categories 조회
 */
const fetchAllExhibitionCategoriesForBackup = async (): Promise<ExhibitionCategory[]> => {
  const categoriesRef = collection(db, 'exhibitionCategories');
  const snapshot = await getDocs(categoriesRef);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      title: data.title,
      description: data.description,
      displayOrder: data.displayOrder,
      workOrders: data.workOrders || [],
      isActive: data.isActive,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as ExhibitionCategory;
  });
};

/**
 * Site Settings 조회
 */
const fetchSettingsForBackup = async (): Promise<SiteSettings> => {
  const settingsRef = collection(db, 'settings');
  const snapshot = await getDocs(settingsRef);

  if (snapshot.empty) {
    throw new Error('Settings not found');
  }

  const doc = snapshot.docs[0];
  const data = doc.data();

  return {
    id: doc.id,
    browserTitle: data.browserTitle,
    browserDescription: data.browserDescription,
    faviconUrl: data.faviconUrl,
    footerText: data.footerText,
    updatedAt: data.updatedAt?.toDate() || new Date(),
  } as SiteSettings;
};

/**
 * 전체 데이터 백업 생성
 */
export const createBackup = async (): Promise<BackupData> => {
  const [works, sentenceCategories, exhibitionCategories, settings] = await Promise.all([
    fetchAllWorksForBackup(),
    fetchAllSentenceCategoriesForBackup(),
    fetchAllExhibitionCategoriesForBackup(),
    fetchSettingsForBackup(),
  ]);

  const backup: BackupData = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    data: {
      works,
      sentenceCategories,
      exhibitionCategories,
      settings,
    },
    metadata: {
      workCount: works.length,
      sentenceCategoryCount: sentenceCategories.length,
      exhibitionCategoryCount: exhibitionCategories.length,
      totalSize: 0, // 클라이언트에서 계산
    },
  };

  return backup;
};

/**
 * 백업 데이터 검증
 */
export const validateBackupData = (data: unknown): data is BackupData => {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const backup = data as Partial<BackupData>;

  // 필수 필드 검증
  if (!backup.version || !backup.timestamp || !backup.data) {
    return false;
  }

  // 데이터 구조 검증
  if (
    !Array.isArray(backup.data.works) ||
    !Array.isArray(backup.data.sentenceCategories) ||
    !Array.isArray(backup.data.exhibitionCategories) ||
    !backup.data.settings
  ) {
    return false;
  }

  return true;
};

/**
 * 백업 데이터를 JSON 파일로 다운로드
 */
export const downloadBackupFile = (backup: BackupData): void => {
  const jsonString = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `portfolio-backup-${timestamp}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};
