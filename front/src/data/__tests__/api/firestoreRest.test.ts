import { describe, it, expect } from 'vitest';
import {
  unwrapValue,
  unwrapFields,
  getDocId,
  type FirestoreRestValue,
} from '@/data/api/firestoreRest';

describe('firestoreRest.unwrapValue', () => {
  it('기본 스칼라 타입을 언랩한다', () => {
    expect(unwrapValue({ stringValue: 'hello' })).toBe('hello');
    expect(unwrapValue({ stringValue: '' })).toBe('');
    expect(unwrapValue({ integerValue: '42' })).toBe(42);
    expect(unwrapValue({ doubleValue: 1.5 })).toBe(1.5);
    expect(unwrapValue({ booleanValue: true })).toBe(true);
    expect(unwrapValue({ booleanValue: false })).toBe(false);
    expect(unwrapValue({ nullValue: null })).toBeNull();
  });

  it('timestamp/reference는 문자열 그대로 통과시킨다', () => {
    expect(unwrapValue({ timestampValue: '2026-01-01T00:00:00Z' })).toBe(
      '2026-01-01T00:00:00Z'
    );
    expect(unwrapValue({ referenceValue: 'projects/p/.../docs/x' })).toBe(
      'projects/p/.../docs/x'
    );
  });

  it('배열을 재귀적으로 언랩한다', () => {
    const value: FirestoreRestValue = {
      arrayValue: {
        values: [{ stringValue: 'a' }, { integerValue: '2' }],
      },
    };
    expect(unwrapValue(value)).toEqual(['a', 2]);
  });

  it('중첩 맵을 재귀적으로 언랩한다', () => {
    const value: FirestoreRestValue = {
      mapValue: {
        fields: {
          venue: { stringValue: 'Gallery' },
          year: { integerValue: '2024' },
        },
      },
    };
    expect(unwrapValue(value)).toEqual({ venue: 'Gallery', year: 2024 });
  });
});

describe('firestoreRest.unwrapFields', () => {
  it('문서 fields 전체를 평범한 객체로 변환한다 (배열·맵 포함)', () => {
    const result = unwrapFields({
      sentence: { stringValue: '문장' },
      displayOrder: { integerValue: '3' },
      isActive: { booleanValue: true },
      keywords: {
        arrayValue: {
          values: [
            {
              mapValue: {
                fields: { id: { stringValue: 'k1' }, label: { stringValue: '키워드' } },
              },
            },
          ],
        },
      },
    });

    expect(result).toEqual({
      sentence: '문장',
      displayOrder: 3,
      isActive: true,
      keywords: [{ id: 'k1', label: '키워드' }],
    });
  });
});

describe('firestoreRest.getDocId', () => {
  it('resource name에서 마지막 세그먼트(문서 ID)를 추출한다', () => {
    expect(
      getDocId('projects/p/databases/(default)/documents/sentenceCategories/abc123')
    ).toBe('abc123');
  });

  it('빈/undefined name은 빈 문자열', () => {
    expect(getDocId(undefined)).toBe('');
    expect(getDocId('')).toBe('');
  });
});
