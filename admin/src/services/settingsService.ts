// Site Settings Firestore 서비스
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { db, storage } from '../config/firebase';
import type { SiteSettings } from '../types';

// 설정은 단일 문서로 관리
const SETTINGS_COLLECTION = 'settings';
const SETTINGS_DOC_ID = 'site';
const FAVICON_PATH = 'settings/favicon';

// 기본 설정값
const DEFAULT_SETTINGS: Omit<SiteSettings, 'id' | 'updatedAt'> = {
  browserTitle: 'Portfolio | 작품 갤러리',
  browserDescription: '여백의 미를 살린 미니멀한 디지털 갤러리',
  footerText: '나혜빈, hyebinnaa@gmail.com, 82)10-8745-1728',
  faviconUrl: undefined,
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
  const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    // 설정이 없으면 기본값으로 생성
    const defaultSettings = {
      ...DEFAULT_SETTINGS,
      updatedAt: serverTimestamp(),
    };
    await setDoc(docRef, defaultSettings);
    return {
      id: SETTINGS_DOC_ID,
      ...DEFAULT_SETTINGS,
      updatedAt: new Date(),
    };
  }

  return mapFirestoreToSiteSettings(docSnap.id, docSnap.data());
};

// 사이트 설정 업데이트
export const updateSiteSettings = async (
  updates: Partial<Omit<SiteSettings, 'id' | 'updatedAt'>>
): Promise<SiteSettings> => {
  const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);

  await setDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  }, { merge: true });

  const updatedDoc = await getDoc(docRef);
  return mapFirestoreToSiteSettings(SETTINGS_DOC_ID, updatedDoc.data() || {});
};

// 파비콘 업로드
export const uploadFavicon = async (file: File): Promise<string> => {
  // 기존 파비콘 삭제 시도
  try {
    const existingRef = ref(storage, `${FAVICON_PATH}/favicon.ico`);
    await deleteObject(existingRef);
  } catch {
    // 기존 파비콘이 없으면 무시
  }

  // 새 파비콘 업로드
  const faviconRef = ref(storage, `${FAVICON_PATH}/favicon.ico`);
  await uploadBytes(faviconRef, file);
  const faviconUrl = await getDownloadURL(faviconRef);

  // 설정에 URL 저장
  await updateSiteSettings({ faviconUrl });

  return faviconUrl;
};

// 파비콘 삭제
export const deleteFavicon = async (): Promise<void> => {
  try {
    const faviconRef = ref(storage, `${FAVICON_PATH}/favicon.ico`);
    await deleteObject(faviconRef);
  } catch {
    // 파비콘이 없으면 무시
  }

  // 설정에서 URL 제거
  await updateSiteSettings({ faviconUrl: undefined });
};