// Site Settings Firestore 서비스 (Front-end용 - 읽기 전용)
import {
  doc,
  getDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { SiteSettings } from '@/types';

// 설정은 단일 문서로 관리
const SETTINGS_COLLECTION = 'settings';
const SETTINGS_DOC_ID = 'site';

// 기본 설정값
const DEFAULT_SETTINGS: SiteSettings = {
  id: SETTINGS_DOC_ID,
  browserTitle: 'Portfolio | 작품 갤러리',
  browserDescription: '여백의 미를 살린 미니멀한 디지털 갤러리',
  footerText: '나혜빈, hyebinnaa@gmail.com, 82)10-8745-1728',
  faviconUrl: undefined,
  updatedAt: new Date(),
};

// Firestore 데이터를 SiteSettings 타입으로 변환
const mapFirestoreToSiteSettings = (
  id: string,
  data: Record<string, unknown>
): SiteSettings => ({
  id,
  browserTitle: (data.browserTitle as string) || DEFAULT_SETTINGS.browserTitle,
  browserDescription: (data.browserDescription as string) || DEFAULT_SETTINGS.browserDescription,
  footerText: (data.footerText as string) || DEFAULT_SETTINGS.footerText,
  faviconUrl: data.faviconUrl as string | undefined,
  updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
});

// 사이트 설정 조회
export const getSiteSettings = async (): Promise<SiteSettings> => {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      // 설정이 없으면 기본값 반환
      return DEFAULT_SETTINGS;
    }

    return mapFirestoreToSiteSettings(docSnap.id, docSnap.data());
  } catch (error) {
    console.error('사이트 설정 조회 실패:', error);
    // 에러 시 기본값 반환
    return DEFAULT_SETTINGS;
  }
};
