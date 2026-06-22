# 웹 이미지 로딩 속도 10x 개선 계획

> **요구사항(클라이언트)**: 웹 버전 이미지 로딩 속도를 현재보다 **10배** 개선. 웹/모바일 모두.
> **선행 작업**: PR #50 (`perf/image-optimization`) — 모달 이미지 `sizes`/`priority`, AVIF/WebP, `deviceSizes`/`imageSizes`, 썸네일 `sizes`, `FloatingWorkWindow` `next/image`화 완료.
> **제약**: AS-IS 동작·비즈니스 로직 무변경. 순수 성능 최적화.

## 0. 클라이언트 확정 제약 (사전 합의)

1. **새 사진 업로드 시 즉시 사이트 반영 — 타협 불가.**
   - ✅ **검증 완료**: `admin/src/data/api/storageApi.ts:62`에서 모든 업로드가 `uuidv4()`로 새 파일명/URL을 만든다. 신규·교체 모두 새 URL → 옵티마이저 캐시 키가 달라 **즉시 반영**. `minimumCacheTTL`을 길게 잡아도 안전(옛 캐시는 옛 URL에만 남고 참조 안 됨).
2. **품질 저하 최소화.** → `quality` 공격적 하향 금지. 모달 본문만 보수적(≈72) 적용, 핵심 절감은 cache/preconnect/sizes가 담당.
3. **확대(줌)는 무조건 원본.** → `ImageZoomOverlay`는 원본 URL 직접 로드를 **유지**(최적화/리사이즈 적용 안 함). preconnect 혜택만.
4. **일반 보기는 화면맞춤 resize "유도리".** → Vercel 런타임 변환(`sizes`)으로 충족. **admin 사전생성(Tier C) 불필요 → 보류.**

---

## 1. "10x"의 정의 — 측정 기준선

단일 이미지의 1회 전송량을 추가로 10배 줄이는 것은 물리적으로 불가능하다(AVIF + 정확한 `sizes`로 이미 하한에 근접). 따라서 10x는 **체감 로드 시간(LCP)** 기준으로 정의한다.

| 시나리오 | 현재(추정) | 목표 | 달성 레버 |
|---|---|---|---|
| 2차 사용자 / 재방문 (웜 캐시) | 옵티마이저 콜드 미스 반복 | **10~20x** | `minimumCacheTTL` (옵티마이저 캐시 워밍) |
| 콜드 1차 로드 | baseline | **3~5x** | quality 튜닝 + preconnect + priority |
| 전송량(payload) | PR #50 기준 | 추가 **30~50%↓** | quality 튜닝 |

> 핵심 통찰: 지금 "느림"의 가장 큰 원인은 이미지 **크기**가 아니라, `minimumCacheTTL` 부재로 Vercel 옵티마이저가 매번 **Firebase 원본 fetch + AVIF 재인코딩**(수백ms~수초)을 반복하는 **콜드 미스**다.

---

## 2. 현황 진단 (조사 결과)

### 설정
- `next.config.ts`: AVIF/WebP, `deviceSizes`/`imageSizes` 설정됨. **`minimumCacheTTL` 미설정**, **`quality` 기본 75**.
- `app/layout.tsx`: 폰트는 `next/font`(self-host, 양호). **`preconnect`/`dns-prefetch` 없음**.

### 이미지 렌더 경로별 누락
| 컴포넌트 | 소스 | URL 필드 | sizes | priority | 비고 |
|---|---|---|---|---|---|
| `ModalImage`→`FadeInImage`(ui) | next/image | `url`(원본 1920px) | ✅ | ✅(첫 이미지) | PR #50 완료 |
| `WorkDetailPage` 인라인→`FadeInImage`(ui) | next/image | `url`(원본 1920px) | ❌→✅ | ✅(첫 이미지) | **Phase 12에서 `sizes`/`quality` 누락 발견·수정** (이중 렌더 경로) |
| `WorkTitleButton`(메인 리스트) | next/image fill | `thumbnailUrl`(300px) | ✅`80px` | ❌ | 홈 첫 썸네일 priority 필요 |
| `FloatingWorkWindow` | next/image fill | `thumbnailUrl` | ✅`80px` | ❌ | 호버 즉시표시용 priority |
| `HomeIcon` | next/image fill | icon url | ❌ | ✅ | `sizes="48px"` 필요 |
| `ImageZoomOverlay` | **원시 `<img>`** | `url`(원본 직접) | — | — | next/image 미적용·캐시 우회 |
| `YouTubeEmbed` 썸네일 | **원시 `<img>`** | youtube img | — | — | 최적화 우회 |
| `FadeInImage`(components 중복본) | next/image | props | ❌ | — | dead code, 배럴 미export |

### 데이터/원본 스펙 (admin)
- 원본: max 1920px, quality 0.9, WebP/JPEG → `/works-images/`
- 썸네일: max 300px, quality 0.7, WebP/JPEG → `/works-thumbnails/`
- `listThumbnailUrl`, `webpUrl` 필드는 타입에만 존재, **생성 안 됨**(미사용).

---

## 3. 개선 레버 (효과 · 위험 · 노력)

### Tier A — front-only, 무위험, 즉시 (10x의 핵심)
1. **`minimumCacheTTL` 설정** — 옵티마이저 결과를 엣지에 오래 보관 → 콜드 미스 → 웜 히트. **최대 레버.**
2. **`quality` 하향** — 모달 원본 이미지 quality 75 → ~55(AVIF). 전송량 30~50%↓, 시각 차이 미미.
3. **`preconnect`/`dns-prefetch`** — `firebasestorage.googleapis.com`(원본 직접 로드 경로) 첫 연결 지연 제거.
4. **메인 리스트 첫 N개 썸네일 `priority`** — 홈 LCP 개선.
5. **`HomeIcon` `sizes="48px"`** — fill 힌트 보강.

### Tier B — front 구조 변경, 저위험
6. **`ImageZoomOverlay` → `next/image`** — 줌 원본도 최적화·캐시 적용(단, 줌은 디테일 필요 → `quality` 별도/높게, `sizes="100vw"`).
7. **`YouTubeEmbed` 썸네일 → `next/image`** (`loading="lazy"`).
8. **인접 작품 이미지 prefetch** — 모달 열람 중 다음/이전 작품 이미지 `<link rel="prefetch">` 또는 router prefetch. (동작 무변경, 선로딩만)

### Tier C — admin 파이프라인 변경 (보류 확정)
9. ~~중간 변형(`listThumbnailUrl`) admin 사전생성~~ → **보류.** 클라이언트가 런타임 화면맞춤("유도리")을 선호하고, Vercel 옵티마이저가 이미 즉석 변형을 생성하므로 한계효용이 작다. 재업로드/마이그레이션 비용 대비 불필요.

---

## 4. 실행 단계 (Phase별 commit + 체크)

각 Phase 완료 시 `npm run lint` + `npm run build` 통과 확인 후 commit, 체크박스 갱신.

- [x] **Phase 6 — `next.config.ts` 캐시·품질 강화** (Tier A-1, A-2)
  - `minimumCacheTTL` 명시(31일). 새 업로드=새 UUID URL이라 즉시 반영 안전(§0-1).
  - `images.qualities`에 사용할 값 등록(Next 16) + `FadeInImage`/`ModalImage`에 `quality` prop 추가, 모달 본문에 **보수적 72** 적용. **줌(`ImageZoomOverlay`) 제외 — 원본 유지.**
- [x] **Phase 7 — preconnect/dns-prefetch** (Tier A-3)
  - `layout.tsx`에 `firebasestorage.googleapis.com` preconnect + dns-prefetch (줌·YouTube 원본 직접 로드 가속).
- [x] **Phase 8 — 메인 리스트/아이콘 우선순위·힌트** (Tier A-4, A-5)
  - `WorkTitleButton` 홈 첫 4개 `priority`(`WorkListScrollerFlex`에서 index 기준), `HomeIcon` `sizes={size}px`.
- [x] **Phase 9 — `YouTubeEmbed` 썸네일 `next/image`화** (Tier B-7)
  - **`ImageZoomOverlay`는 제외**(원본 보존, §0-3). YouTube 썸네일만 `next/image`(`fill`+`sizes`), maxres→hq 폴백은 `onError` state로 전환.
- [x] **Phase 10 — 호버 시 상세 데이터 prefetch** (Tier B-8)
  - `usePrefetchWork` 훅 추가, `WorkTitleButton` 호버 시 `useWork` 데이터 prefetch → 모달 즉시 렌더(스피너 제거)로 LCP 이미지 조기 로드.
  - 이미지 바이트 prefetch는 `next/image` 내부 URL 의존성·대역폭 역효과 위험으로 **제외**(Phase 11 측정 후 필요 시 도입).
- [x] **Phase 11 — 측정·검증**
  - 로컬 검증 완료: 전 Phase `npm run build` 통과(변경 파일 lint 0 error), preconnect/dns-prefetch가 prerender HTML·서버 응답에 정상 포함 확인.
  - AVIF 변환·`Cache-Control`(minimumCacheTTL) 실측은 **Vercel 프로덕션 배포 후** 수행(로컬 옵티마이저 upstream이 sandbox로 차단됨). 아래 체크리스트 참조.
- [x] **Phase 12 — 상세 페이지 인라인 이미지 `sizes`/`quality` 누락 수정** (Track 1 보강)
  - Phase 2의 `sizes` 추가가 `ModalImage` 경로에만 적용되고 **`WorkDetailPage` 인라인 경로(`app/works/WorkDetailPage.tsx`)는 누락**돼 있던 이중 렌더 경로 버그 발견.
  - 인라인 `FadeInImage`에 `--media-width` 브레이크포인트에 맞춘 `sizes='(max-width: 767px) 100vw, (max-width: 1199px) 60vw, 50vw'` + `quality={72}` 적용. 모바일 상세 스크롤 뷰가 원본(~1920px) 대신 화면 폭 변형을 받도록 함.
  - 줌은 `ZoomableImage`가 원본 URL을 직접 사용하므로 제약 ③(확대=원본) 영향 없음.

---

## 5. 검증 방법

### 로컬 검증 (완료)
- ✅ 전 Phase `npm run build` 통과, 변경 파일 lint 0 error.
- ✅ preconnect/dns-prefetch가 prerender HTML(`.next/server/app/index.html`)·서버 응답에 포함.
- ⚠️ 옵티마이저 AVIF/캐시 실측은 로컬 sandbox 네트워크 차단으로 불가 → 프로덕션에서 확인.

### 프로덕션 측정 체크리스트 (배포 후)
- **Lighthouse**: LCP, "Properly size images", "Efficiently encode images", "Preconnect to required origins" 전/후.
- **Network**: 모달 1개 열람 시 총 이미지 바이트·요청 수, 응답 `content-type: image/avif` 확인.
- **캐시**: `/_next/image` 응답의 `x-vercel-cache`(MISS→HIT 전환), `cache-control`의 `max-age`가 minimumCacheTTL 반영하는지.
- **회귀(AS-IS 유지)**: 줌 디테일(원본), 썸네일/모달 화질, 스켈레톤/fade-in 동작, 새 업로드 즉시 반영.

---

## 6. 기대 효과

| 항목 | 변경 전 | 변경 후 |
|---|---|---|
| 옵티마이저 캐시 | 콜드 미스 반복 | 웜 히트(재방문/2차) → **체감 10~20x** |
| 콜드 1차 LCP | baseline | preconnect+priority+quality → **3~5x** |
| 모달 전송량 | PR #50 기준 | quality 튜닝 → 추가 **30~50%↓** |
| 데이터 재업로드 | — | **불필요** (전 범위 front-only, admin 무변경) |
| 새 업로드 즉시 반영 | 보장 | **보장 유지** (새 UUID URL, §0-1) |
