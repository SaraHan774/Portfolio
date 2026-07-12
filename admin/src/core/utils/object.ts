// 객체 관련 순수 유틸리티 함수

/**
 * 값이 `undefined`인 키를 제거한 얕은 복사본을 반환한다.
 *
 * Firestore는 `undefined` 값을 거부하므로(문서 쓰기 시 throw), 저장 직전 이미지/작품
 * 객체에서 undefined 필드를 걸러내는 데 사용한다. 저장 경로(WorkForm)와 백필 경로
 * (useBlurBackfill)가 동일하게 이 함수를 거쳐야 레거시 데이터의 undefined 필드로 인한
 * 쓰기 실패를 막을 수 있다.
 */
export const removeUndefinedValues = <T extends object>(obj: T): T => {
  const result = {} as T;
  for (const key of Object.keys(obj) as Array<keyof T>) {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }
  return result;
};
