// Works Server API — Firestore REST API로 첫 진입 SSR preload용 첫 이미지 메타 조회
//
// 배경: firebase-admin이 없어 서버에서 클라이언트 SDK(getDoc)를 쓸 수 없다.
// 대신 Firestore REST API를 서버 fetch로 직접 호출해 필요한 필드(첫 이미지의
// url/width/height)만 최소 파싱한다.
//
// 안전성 원칙: 이 함수는 절대 페이지 렌더를 깨면 안 된다.
// 비-200 / 타임아웃 / 파싱 실패 / 미발행 / 이미지 없음 → 전부 null 반환(throw 금지).
// null이면 호출부에서 preload 링크를 렌더하지 않아 기존 동작이 그대로 보존된다.

import { FIREBASE_COLLECTIONS } from '@/core/constants';

/** preload 대상 첫 이미지의 최소 메타. */
export interface PreloadImageMeta {
  url: string;
  width: number;
  height: number;
}

/** Firestore REST 응답의 typed value 래퍼(필요한 형태만 부분 정의). */
interface FirestoreValue {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
  arrayValue?: { values?: FirestoreValue[] };
  mapValue?: { fields?: Record<string, FirestoreValue> };
}

interface FirestoreDocument {
  fields?: Record<string, FirestoreValue>;
}

/** REST 타임아웃(ms). 너무 길면 첫 진입 TTFB를 잡아먹으므로 짧게. */
const FETCH_TIMEOUT_MS = 1500;

/** Firestore typed value에서 number를 안전하게 추출. */
function readNumber(value: FirestoreValue | undefined): number | null {
  if (!value) return null;
  if (typeof value.integerValue === 'string') {
    const n = Number(value.integerValue);
    return Number.isFinite(n) ? n : null;
  }
  if (typeof value.doubleValue === 'number' && Number.isFinite(value.doubleValue)) {
    return value.doubleValue;
  }
  return null;
}

/** Firestore typed value에서 string을 안전하게 추출. */
function readString(value: FirestoreValue | undefined): string | null {
  return typeof value?.stringValue === 'string' ? value.stringValue : null;
}

/**
 * works/{id} 문서에서 order가 가장 작은 이미지의 url/width/height를 파싱한다.
 * 어떤 단계든 누락/형식 이상이면 null.
 */
function parseFirstImageMeta(doc: FirestoreDocument): PreloadImageMeta | null {
  const fields = doc.fields;
  if (!fields) return null;

  // 발행된 작품만 preload (상세 페이지가 미발행을 NotFound 처리하므로 일관)
  if (fields.isPublished?.booleanValue !== true) return null;

  const imageValues = fields.images?.arrayValue?.values;
  if (!imageValues || imageValues.length === 0) return null;

  // order 최소(없으면 배열 첫) 이미지 선택
  let best: { meta: PreloadImageMeta; order: number } | null = null;

  for (let i = 0; i < imageValues.length; i += 1) {
    const imgFields = imageValues[i]?.mapValue?.fields;
    if (!imgFields) continue;

    const url = readString(imgFields.url);
    const width = readNumber(imgFields.width);
    const height = readNumber(imgFields.height);
    if (!url || width === null || height === null || width <= 0 || height <= 0) {
      continue;
    }

    const order = readNumber(imgFields.order) ?? i;
    if (!best || order < best.order) {
      best = { meta: { url, width, height }, order };
    }
  }

  return best?.meta ?? null;
}

/**
 * 첫 진입 SSR에서 preload할 첫 이미지 메타를 Firestore REST로 조회한다.
 * 실패는 모두 null(graceful) — 호출부는 null이면 preload를 생략한다.
 */
export async function fetchFirstImageForPreload(
  workId: string
): Promise<PreloadImageMeta | null> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  if (!projectId || !apiKey || !workId) return null;

  const encodedId = encodeURIComponent(workId);
  const url =
    `https://firestore.googleapis.com/v1/projects/${projectId}` +
    `/databases/(default)/documents/${FIREBASE_COLLECTIONS.WORKS}/${encodedId}` +
    `?key=${apiKey}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      // force-dynamic 페이지이므로 매 요청 최신값. (캐시 불일치로 인한 오작동 방지)
      cache: 'no-store',
    });

    if (!res.ok) return null;

    const doc = (await res.json()) as FirestoreDocument;
    return parseFirstImageMeta(doc);
  } catch {
    // 타임아웃(abort), 네트워크, JSON 파싱 등 모든 예외를 흡수
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
