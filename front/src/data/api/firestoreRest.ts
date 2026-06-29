/**
 * Firestore REST API 응답 파싱 유틸 (순수 함수, Next/Firebase 비의존).
 *
 * REST 문서의 typed-value(`stringValue`/`integerValue`/`mapValue`/`arrayValue` ...)를
 * 클라이언트 SDK의 `doc.data()`와 동일한 평범한 JS 객체로 언랩한다. 이렇게 하면
 * 기존 도메인 매퍼(`mapFirestoreToSentenceCategory` 등)를 그대로 재사용할 수 있다.
 */

export interface FirestoreRestValue {
  nullValue?: null;
  booleanValue?: boolean;
  integerValue?: string;
  doubleValue?: number;
  timestampValue?: string;
  stringValue?: string;
  referenceValue?: string;
  arrayValue?: { values?: FirestoreRestValue[] };
  mapValue?: { fields?: Record<string, FirestoreRestValue> };
}

export interface FirestoreRestDocument {
  name?: string;
  fields?: Record<string, FirestoreRestValue>;
}

export interface FirestoreRestListResponse {
  documents?: FirestoreRestDocument[];
}

/** 단일 typed-value를 평범한 JS 값으로 언랩(맵/배열은 재귀) */
export const unwrapValue = (value: FirestoreRestValue): unknown => {
  if ('nullValue' in value) return null;
  if (value.booleanValue !== undefined) return value.booleanValue;
  if (value.integerValue !== undefined) return Number(value.integerValue);
  if (value.doubleValue !== undefined) return value.doubleValue;
  if (value.timestampValue !== undefined) return value.timestampValue;
  if (value.stringValue !== undefined) return value.stringValue;
  if (value.referenceValue !== undefined) return value.referenceValue;
  if (value.arrayValue !== undefined) {
    return (value.arrayValue.values ?? []).map(unwrapValue);
  }
  if (value.mapValue !== undefined) {
    return unwrapFields(value.mapValue.fields ?? {});
  }
  return undefined;
};

/** REST 문서의 `fields`를 평범한 객체로 언랩 */
export const unwrapFields = (
  fields: Record<string, FirestoreRestValue>
): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(fields)) {
    result[key] = unwrapValue(fields[key]);
  }
  return result;
};

/** 문서 resource name(`projects/.../documents/col/{id}`)에서 문서 ID 추출 */
export const getDocId = (name: string | undefined): string => {
  if (!name) return '';
  const segments = name.split('/');
  return segments[segments.length - 1] ?? '';
};
