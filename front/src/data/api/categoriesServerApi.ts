/**
 * 카테고리 서버 사이드 조회 (SSR 전용).
 *
 * 레이아웃 SSR 프리페치에서 카테고리를 읽을 때, 브라우저용 Firebase SDK(WebChannel/롱폴링)는
 * 서버(Node/서버리스)에서 매 요청 연결 핸드셰이크가 느리고 연결 재사용이 안 된다.
 * 이 모듈은 대신 **Firestore REST API(stateless HTTP)** 로 읽고 결과를 짧은 TTL로 캐시한다.
 *
 * - REST 실패(환경변수 부재 / 비-200 / 타임아웃 / 에뮬레이터)는 graceful: null을 반환하고
 *   호출부가 기존 클라이언트 SDK 경로로 폴백한다(동작 보존).
 * - 결과는 도메인 매퍼로 변환해 클라이언트 훅과 동일한 형태 → 하이드레이션 캐시 히트 유지.
 *
 * ⚠️ 이 모듈은 서버(레이아웃)에서만 import한다(REST 호출·unstable_cache는 서버 전용).
 */

import { unstable_cache } from 'next/cache';
import { FIREBASE_COLLECTIONS } from '@/core/constants';
import {
  mapFirestoreToSentenceCategory,
  mapFirestoreToExhibitionCategory,
  filterActiveCategories,
  sortByDisplayOrder,
} from '@/data/mappers/categoryMapper';
import { CategoryRepository } from '@/data/repository/CategoryRepository';
import {
  unwrapFields,
  getDocId,
  type FirestoreRestListResponse,
} from '@/data/api/firestoreRest';
import type { SentenceCategory, ExhibitionCategory } from '@/core/types';

/** 카테고리는 거의 변하지 않으므로 짧은 TTL로 캐시(매 요청 Firestore 왕복 제거) */
const CATEGORY_REVALIDATE_SECONDS = 60;
/** REST 응답 상한 — 초과 시 폴백 */
const REST_TIMEOUT_MS = 1500;

/**
 * Firestore REST(list documents)로 컬렉션 문서를 읽어 {id, data}로 언랩한다.
 * 실패 시 null(폴백 신호). throw하지 않는다.
 */
const fetchCollectionViaRest = async (
  collectionId: string
): Promise<Array<{ id: string; data: Record<string, unknown> }> | null> => {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  // 환경변수 부재 또는 에뮬레이터 모드면 REST를 쓰지 않고 폴백
  if (!projectId || !apiKey) return null;
  if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') return null;

  const url =
    `https://firestore.googleapis.com/v1/projects/${projectId}` +
    `/databases/(default)/documents/${collectionId}?key=${apiKey}&pageSize=300`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REST_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    const json = (await res.json()) as FirestoreRestListResponse;
    const documents = json.documents ?? [];
    return documents.map((doc) => ({
      id: getDocId(doc.name),
      data: unwrapFields(doc.fields ?? {}),
    }));
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
};

// --- Sentence categories ---------------------------------------------------

const loadSentenceCategoriesViaRest = async (): Promise<SentenceCategory[]> => {
  const docs = await fetchCollectionViaRest(FIREBASE_COLLECTIONS.SENTENCE_CATEGORIES);
  if (!docs) throw new Error('sentence categories REST 조회 실패');
  const mapped = docs.map((d) => mapFirestoreToSentenceCategory(d.id, d.data));
  return sortByDisplayOrder(filterActiveCategories(mapped));
};

const getSentenceCategoriesCached = unstable_cache(
  loadSentenceCategoriesViaRest,
  ['ssr-sentence-categories'],
  { revalidate: CATEGORY_REVALIDATE_SECONDS, tags: ['categories'] }
);

/**
 * SSR 프리페치용: REST(캐시) 우선, 실패 시 기존 클라이언트 SDK 경로로 폴백.
 */
export const getSentenceCategoriesForSSR = async (): Promise<SentenceCategory[]> => {
  try {
    return await getSentenceCategoriesCached();
  } catch {
    return CategoryRepository.getSentenceCategories();
  }
};

// --- Exhibition categories -------------------------------------------------

const loadExhibitionCategoriesViaRest = async (): Promise<ExhibitionCategory[]> => {
  const docs = await fetchCollectionViaRest(FIREBASE_COLLECTIONS.EXHIBITION_CATEGORIES);
  if (!docs) throw new Error('exhibition categories REST 조회 실패');
  const mapped = docs.map((d) => mapFirestoreToExhibitionCategory(d.id, d.data));
  return sortByDisplayOrder(filterActiveCategories(mapped));
};

const getExhibitionCategoriesCached = unstable_cache(
  loadExhibitionCategoriesViaRest,
  ['ssr-exhibition-categories'],
  { revalidate: CATEGORY_REVALIDATE_SECONDS, tags: ['categories'] }
);

/**
 * SSR 프리페치용: REST(캐시) 우선, 실패 시 기존 클라이언트 SDK 경로로 폴백.
 */
export const getExhibitionCategoriesForSSR = async (): Promise<ExhibitionCategory[]> => {
  try {
    return await getExhibitionCategoriesCached();
  } catch {
    return CategoryRepository.getExhibitionCategories();
  }
};
