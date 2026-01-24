/**
 * Settings API - Firestore Site Settings 직접 접근
 */
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteField,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './client';
import { collections } from '../../core/constants';
import { mapFirestoreToSiteSettings, DEFAULT_SITE_SETTINGS } from '../mappers';
import type { SiteSettings } from '../../core/types';

const SETTINGS_DOC_ID = 'site';

/**
 * 사이트 설정 조회
 */
export const fetchSiteSettings = async (): Promise<SiteSettings> => {
  const docRef = doc(db, collections.settings, SETTINGS_DOC_ID);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    // 설정이 없으면 기본값으로 생성
    const defaultSettings = {
      ...DEFAULT_SITE_SETTINGS,
      updatedAt: serverTimestamp(),
    };
    await setDoc(docRef, defaultSettings);
    return {
      id: SETTINGS_DOC_ID,
      ...DEFAULT_SITE_SETTINGS,
      updatedAt: new Date(),
    };
  }

  return mapFirestoreToSiteSettings(docSnap.id, docSnap.data());
};

/**
 * 사이트 설정 업데이트
 */
export const updateSiteSettings = async (
  updates: Partial<Omit<SiteSettings, 'id' | 'updatedAt'>>
): Promise<SiteSettings> => {
  const docRef = doc(db, collections.settings, SETTINGS_DOC_ID);

  await setDoc(
    docRef,
    {
      ...updates,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  const updatedDoc = await getDoc(docRef);
  return mapFirestoreToSiteSettings(SETTINGS_DOC_ID, updatedDoc.data() || {});
};

/**
 * 파비콘 URL 업데이트
 */
export const updateFaviconUrl = async (faviconUrl: string): Promise<void> => {
  const docRef = doc(db, collections.settings, SETTINGS_DOC_ID);
  await setDoc(
    docRef,
    {
      faviconUrl,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};

/**
 * 파비콘 URL 삭제
 */
export const removeFaviconUrl = async (): Promise<void> => {
  const docRef = doc(db, collections.settings, SETTINGS_DOC_ID);
  await updateDoc(docRef, {
    faviconUrl: deleteField(),
    updatedAt: serverTimestamp(),
  });
};

/**
 * 홈 아이콘 URL 업데이트 (기본 상태)
 */
export const updateHomeIconUrl = async (homeIconUrl: string): Promise<void> => {
  const docRef = doc(db, collections.settings, SETTINGS_DOC_ID);
  await setDoc(
    docRef,
    {
      homeIconUrl,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};

/**
 * 홈 아이콘 URL 업데이트 (호버 상태)
 */
export const updateHomeIconHoverUrl = async (homeIconHoverUrl: string): Promise<void> => {
  const docRef = doc(db, collections.settings, SETTINGS_DOC_ID);
  await setDoc(
    docRef,
    {
      homeIconHoverUrl,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};

/**
 * 홈 아이콘 URL 삭제 (기본 상태)
 */
export const removeHomeIconUrl = async (): Promise<void> => {
  const docRef = doc(db, collections.settings, SETTINGS_DOC_ID);
  await updateDoc(docRef, {
    homeIconUrl: deleteField(),
    updatedAt: serverTimestamp(),
  });
};

/**
 * 홈 아이콘 URL 삭제 (호버 상태)
 */
export const removeHomeIconHoverUrl = async (): Promise<void> => {
  const docRef = doc(db, collections.settings, SETTINGS_DOC_ID);
  await updateDoc(docRef, {
    homeIconHoverUrl: deleteField(),
    updatedAt: serverTimestamp(),
  });
};

/**
 * 홈 아이콘 크기 업데이트
 */
export const updateHomeIconSize = async (size: number): Promise<void> => {
  const docRef = doc(db, collections.settings, SETTINGS_DOC_ID);
  await setDoc(
    docRef,
    {
      homeIconSize: size,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};
