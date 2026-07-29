# 계획서 ③: 이미지 prefetch (비용 제어형)

> 상태: **초안 (구현 보류)**
> 난이도: 중간 · 디자인 변화: 없음 · Storage 비용: 콜드 미스분만 (제어 가능)

## 1. 목표

강한 인텐트 시점에 **첫 이미지 1장의 바이트**를 미리 받아둬, 클릭 후 브라우저 캐시에서 거의 즉시 표시. 체감 개선 폭이 가장 크다.

- ①(데이터 prefetch)이 URL을 당긴다면, ③은 **바이트**까지 당긴다.
- 단독으로도 동작하나 ①과 함께 쓰면 URL·바이트 모두 워밍.

## 2. 비용 모델 (중요)

프로덕션은 브라우저가 Storage에서 직접 받지 않고 **`/_next/image` 최적화 캐시**(`minimumCacheTTL` 31일)를 거친다.

- 같은 변형을 여러 번 prefetch해도 **Firebase Storage egress는 31일에 콜드 미스 1회**. 나머지는 호스트/CDN 대역폭.
- 따라서 prefetch가 늘리는 Storage 비용 = "그 기간 아무도 안 받은 새 변형 × 크기". 인기 작품일수록 0에 수렴.
- **진짜 낭비** = (안 열 작품) × (캐시에도 없음) × (콜드로 Storage 깨움). → 인텐트 게이팅으로 차단.

## 3. 비용 제어 규칙

1. **작품당 첫 이미지 1장만** prefetch (전체 이미지 X).
2. **강한 인텐트에서만 발사**:
   - 데스크톱: 호버 **150~200ms 유지** 시 (스쳐 지나간 호버 제외).
   - 모바일: `touchstart`/`pointerdown`(탭 직전).
3. **중복 차단**: 이미 prefetch/캐시한 URL은 `Set`으로 기록해 재발사 금지.
4. **뷰포트/네트워크 가드(선택)**: `navigator.connection.saveData`나 느린 연결(2g/3g)에서는 스킵.

## 4. 구현 방식

- prefetch 대상은 **next/image 실제 변형 URL**이어야 캐시 적중. ②의 변형 URL 구성 유틸을 공유.
  - 방법 A: `<link rel="prefetch" as="image" imagesrcset=... imagesizes=...>`를 동적으로 head에 append.
  - 방법 B: `const img = new Image(); img.src = '/_next/image?url=...&w=...&q=72'` 로 단일 변형 워밍(간단, 단 sizes 분기 손실 → 대표 폭 1개 선택).
- 추천: **방법 A**(sizes 분기 유지) + 인텐트 디바운스 래퍼 훅 `usePrefetchFirstImage(work)`.
- 호출 지점:
  - 홈 `WorkTitleButton`: 기존 `onMouseEnter`의 데이터 prefetch 옆에, 디바운스 후 이미지 prefetch 추가.
  - 캡션 링크/`FloatingWorkWindow`: 호버 인텐트 시 동일 훅 호출.

## 5. 변경 파일(예상)

- `front/src/domain/hooks/usePrefetchFirstImage.ts` (신규) — 변형 URL 구성 + 인텐트 디바운스 + 중복 Set.
- `front/src/presentation/components/work/WorkTitleButton.tsx` — 호버/터치 인텐트에서 호출.
- `front/src/domain/hooks/useCaptionHoverEvents.ts` — 캡션 링크 인텐트에서 호출.
- 변형 URL 유틸은 ②와 공유(`buildNextImageUrl`).

## 6. 리스크 / 주의

- **변형 URL 불일치 = 캐시 미적중 + 이중 다운로드**: `w/q/sizes`를 ②와 동일 상수로.
- **저사양/데이터 절약 모드 낭비**: saveData 가드로 완화.
- **모바일 touchstart 오발화**: 스크롤 제스처 구분(이동 임계) 또는 첫 1장·중복차단으로 비용 상한 유지.
- 이미지 prefetch는 ①·②와 달리 실제 대역폭을 쓰므로, **인텐트 게이팅이 무력화되지 않도록** 디바운스 로직을 우선 검증.

## 7. 검증 — 측정 가능한 벤치마크

> 합격 기준 전문: [BENCHMARKS.md §4 ③](./BENCHMARKS.md#4-plan별-합격-기준-pass-gate)

**Pass gate:**
- 클릭 후 첫 이미지 **Load Time ≈ 0**(disk/memory 캐시 히트, 재전송 없음).
- 인텐트 미충족 호버(스쳐 지나감)에서 `/_next/image` 요청 **0건**(낭비 차단).
- 콜드 미스 노출 = 작품당 **최대 1 변형**(첫 이미지 1장 한정).

**측정 절차:**
- DevTools 네트워크 탭: 호버 150ms+ 유지 시에만 첫 이미지 prefetch 발생, 짧은 호버엔 미발생 확인.
- 클릭 후 첫 이미지가 `(from disk cache)` / `(from memory cache)`로 로드되는지 확인.
- Performance 트레이스로 클릭→LCP 구간 before/after 비교(클라이언트 네비라 Lighthouse 대신).

## 8. 롤백

- 인텐트 훅 호출 제거로 원복. 데이터/타입 변경 없음.
