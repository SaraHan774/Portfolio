# 계획서 ①: 데이터 prefetch 보강

> 상태: **초안 (구현 보류)**
> 난이도: 낮음 · 디자인 변화: 없음 · Storage 비용: ~0

## 1. 목표

상세 진입 **직전**에 작품 메타데이터(이미지 URL 포함)를 React Query 캐시에 미리 채워, 클릭 순간 `useWork`가 캐시 히트하도록 한다. 워터폴의 "하이드레이션 → 쿼리 → Firestore getDoc" 구간을 클릭 전으로 옮긴다.

- 이미지 바이트는 아직 안 받으므로 다운로드 시간 자체는 그대로. **"URL 알아내는 지연"만 제거** (수백 ms 절약).
- 비용: Firestore read 1회. Storage egress 무관.

## 2. 현재 상태

- `usePrefetchWork` 훅 존재: `front/src/domain/hooks/useWorks.ts:47-61`.
- **구현된 곳**: 홈의 `WorkTitleButton` 호버(`onMouseEnter`) → `prefetchWork(work.id)` (`WorkTitleButton.tsx:127-130`).
- **누락된 곳**:
  - 상세 화면 **캡션 링크 호버** → `FloatingWorkWindow`가 뜨지만 prefetch 미실행 (`useCaptionHoverEvents.ts`).
  - **모바일**: 호버가 없어 prefetch가 전혀 안 걸림. 터치로 바로 진입.

## 3. 변경 내용

### (a) 캡션 링크 호버 prefetch
- `useCaptionHoverEvents`의 `handleLinkMouseEnter`에서 `linkWorkId` 확정 시 `prefetchWork(linkWorkId)` 호출.
- 이미 `FloatingWorkWindow` 표시용 hoverDelay 타이머가 있으므로, 같은 인텐트 시점에 prefetch를 끼운다.
- 파일: `front/src/domain/hooks/useCaptionHoverEvents.ts`.

### (b) 모바일 인텐트 prefetch
- 호버가 없는 모바일은 `onTouchStart`(또는 `onPointerDown`)에서 `prefetchWork(work.id)` 호출.
- 탭 직전 prefetch라 클릭→렌더 사이 짧은 시간이라도 데이터 leg를 당김.
- 파일: `front/src/presentation/components/work/WorkTitleButton.tsx` (`onMouseEnter`와 별도로 `onTouchStart` 추가).

### (c) 호버 디바운스(선택, 비용 관점)
- 데이터 prefetch는 비용이 거의 0이라 디바운스 필수는 아님. 다만 과도한 Firestore read를 피하려면 호버 100~150ms 유지 시에만 발사하도록 통일 가능.
- `usePrefetchWork`는 React Query가 staleTime 내 중복 호출을 자동 dedupe하므로 안전.

## 4. 리스크 / 주의

- React Query `prefetchQuery`는 동일 키 중복 시 dedupe되고 staleTime(10분) 내 재요청 없음 → 과호출 위험 낮음.
- 모바일 `onTouchStart`는 스크롤 제스처에서도 발화할 수 있음 → 비용이 거의 0이라 허용 가능하나, 신경 쓰이면 `onPointerDown` + 짧은 이동 임계로 제한.
- 캡션 링크 prefetch는 `FloatingWorkWindow` 로직과 타이머를 공유하므로 중복 타이머 생성 주의.

## 5. 검증 — 측정 가능한 벤치마크

> 합격 기준 전문: [BENCHMARKS.md §4 ①](./BENCHMARKS.md#4-plan별-합격-기준-pass-gate)

**Pass gate (5회 중앙값):**
- 진입 인텐트(호버/터치) 후 클릭 시 Firestore getDoc **추가 요청 0건**(캐시 히트).
- 클릭→첫 이미지 요청 시작 지연(Load Delay 상당) **≥ 30% 단축** (캡션 링크·모바일 경로).
- Storage egress 증가 없음(Firestore read만), 기존 동작 회귀 없음.

**측정 절차:**
- DevTools 네트워크 탭으로 호버/터치 시점 Firestore 요청 선발생 + 클릭 후 추가 요청 0 확인.
- 클라이언트 네비게이션은 Lighthouse로 안 잡히므로, Performance 패널 트레이스로 클릭→이미지 요청 구간을 before/after 비교.

## 6. 롤백

- 추가한 prefetch 호출만 제거하면 즉시 원복. 데이터/타입 변경 없음.
