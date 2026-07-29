# 벤치마크 — 측정 방법 · 베이스라인 · plan별 합격 기준

> 각 plan은 "체감이 좋아졌다"가 아니라 **숫자로 통과/실패**가 판정돼야 한다.
> 측정기: [`measure-lcp.sh`](./measure-lcp.sh) (Lighthouse 12.x, mobile, N회 중앙값).

## 1. 측정 방법 (공통 프로토콜)

- **도구**: Lighthouse mobile(throttling 기본), 기존 리포트와 동일 form factor.
- **대상 URL**: 테스트 작품 고정
  `https://hyebinna.com/?exhibitionId=6YOWXaVDmK54vzBZph7H&workId=9Ehrmcpebh5mZwRv8qGF`
- **표본**: plan 적용 전/후 각 **5회 측정 → 중앙값**(분산 큰 LCP 보정).
- **핵심 지표**: LCP 총합 + **단계 분해**(TTFB / Load Delay / Load Time / Render Delay).
  이 분해가 plan별 타깃 구간을 직접 가리킨다.
- **캐시 상태 구분**: `/_next/image` 엣지 캐시 워밍 여부가 Load Time을 좌우 →
  라벨을 `*-cold` / `*-warm`으로 나눠 측정. **Load Delay는 캐시 무관**이라 워터폴 plan(①②③)의 1차 KPI.

```bash
cd docs/plans/first-image-loading
./measure-lcp.sh "<URL>" baseline-cold 5     # plan 적용 전
# ... plan 구현 후 ...
./measure-lcp.sh "<URL>" plan2-cold 5        # plan 적용 후 (같은 URL/조건)
```

> 운영 URL 대신 로컬 `npm run build && npm start` 빌드를 측정해도 됨(코드 변경을 배포 전 검증). 단 cold/warm·throttling을 동일하게 유지.

## 2. 베이스라인 (현재값, 기존 리포트에서 추출)

| 지표 | cold 런(`lh-detail`) | warm 런(`lh-detail-after`) |
|---|---|---|
| Perf score | 57 | 68 |
| FCP | 3,935 ms | 2,730 ms |
| **LCP** | **14,838 ms** | **7,545 ms** |
| Speed Index | 8,931 ms | 5,236 ms |
| TBT | 120 ms | 37 ms |
| LCP·TTFB | 642 ms | 850 ms |
| **LCP·Load Delay** | 1,931 ms | **4,332 ms** |
| **LCP·Load Time** | **10,661 ms** | 160 ms |
| LCP·Render Delay | 1,603 ms | 2,201 ms |
| 총 전송량 | 2,346 KB | 1,382 KB |

> ⚠️ 두 런은 캐시 상태가 달라(특히 Load Time 10,661ms vs 160ms) 1:1 비교가 아님.
> **구현 착수 전 5회 중앙값으로 cold/warm 베이스라인을 다시 고정**하는 것이 step 0.
> LCP 요소는 두 런 모두 **첫 상세 이미지 `<img>`**(2500×4096, AVIF via `/_next/image`)로 확인됨 → 우리가 줄이려는 대상과 일치.

## 3. LCP 단계 → plan 매핑

| LCP 단계 | 의미 | 줄이는 plan |
|---|---|---|
| TTFB | 서버 응답 | (범위 밖) |
| **Load Delay** | FCP~이미지 요청 시작 = CSR 워터폴(하이드→쿼리→Firestore→URL) | **② SSR/preload, ① 데이터 prefetch, ③ 이미지 prefetch** |
| **Load Time** | 이미지 다운로드 | **③ 이미지 prefetch**(클릭 시 캐시 히트), (간접) 기존 AVIF/캐시 |
| Render Delay | 페인트까지 지연 | ④ LQIP(첫 형상 즉시 → 체감), 일부 ② |

## 4. plan별 합격 기준 (pass gate)

각 plan은 아래 게이트를 **5회 중앙값**으로 충족해야 "완료".

### ① 데이터 prefetch 보강
- **시나리오**: SPA 내부 네비게이션(목록/캡션/모바일에서 작품 진입).
- **측정**: 진입 인텐트(호버/터치) → 클릭 시 `useWork`가 **캐시 히트**(네트워크 탭에 Firestore 문서 추가 요청 0).
- **게이트**:
  - 클릭 후 Firestore getDoc 추가 요청 **0건**(prefetch로 충족).
  - 클릭→첫 이미지 요청 시작까지의 지연(Load Delay 상당) **≥ 30% 단축**(캡션 링크·모바일 경로).
- **부수**: Storage egress 증가 없음(Firestore read만), 회귀 없음.

### ② SSR / preload
- **시나리오**: `workId` 직접 진입(cold).
- **측정**: HTML 소스에 첫 이미지 `<link rel="preload" as="image">` 존재 + 네트워크 워터폴에서 **첫 이미지 요청이 JS 번들/하이드레이션 이전**에 시작.
- **게이트** (cold, 5회 중앙값):
  - **LCP·Load Delay: 4,332ms → ≤ 1,500ms** (≈ TTFB+α 수준까지).
  - **LCP 총합: baseline 대비 ≥ 25% 단축**.
  - preload URL과 next/image 실제 요청 URL **일치**(이중 다운로드 0 — 네트워크에 중복 변형 없음).

### ③ 이미지 prefetch
- **시나리오**: SPA 내부 네비게이션, 강한 인텐트(호버 150ms+/touchstart).
- **측정**: 인텐트 시 첫 이미지 변형 prefetch → 클릭 후 **disk/memory 캐시 히트**.
- **게이트**:
  - 클릭 후 첫 이미지 **Load Time ≈ 0**(캐시 히트, 재전송 없음).
  - 안 열고 지나간 작품엔 prefetch **미발사**(낭비 차단: 인텐트 미충족 호버에서 `/_next/image` 요청 0).
  - 콜드 미스 노출 = 작품당 최대 **1 변형**(첫 이미지 1장 한정 확인).

### ④ LQIP 블러
- **주의**: LCP 요소는 여전히 실이미지라 **LCP 총합은 크게 안 변할 수 있음** → LCP만으로 판정하지 말 것.
- **측정(체감 프록시)**: 이미지 컨테이너의 **첫 non-blank paint 시각**(블러 표시) — 트레이스/스크린샷 타임라인 또는 `element-render-delay` 관찰.
- **게이트**:
  - 첫 형상(블러) paint **≤ FCP 근처**(0ms급, 스켈레톤 1.2s 지연 제거 확인).
  - 추가 전송량 **장당 ≤ 2KB**(인라인 data URL 상한), 총 문서 크기 회귀 없음.
  - LCP·Speed Index **악화 없음**(±5% 이내).

## 5. 결과 기록 템플릿

각 plan PR에 아래 표를 첨부(측정기 `summary.json`에서 전사).

| 지표 | before(중앙값) | after(중앙값) | Δ | 게이트 통과 |
|---|---|---|---|---|
| LCP | | | | |
| LCP·Load Delay | | | | |
| LCP·Load Time | | | | |
| FCP | | | | |
| Speed Index | | | | |
| 총 전송량 | | | | |
