# 다음 권장 작업: CSR 렌더 Waterfall 개선 (LCP 7.5s → 목표 <2.5s)

> **상태**: 계획만 작성(미착수). 이미지(PR #50)·폰트(PR #53) 최적화는 완료·검증됨.
> **범위 주의**: 이 작업은 이미지/폰트와 달리 **렌더링 아키텍처를 건드린다**(CSR→SSR/RSC 일부 전환). AS-IS 동작 보존 난이도가 높아, 단계별로 작게 쪼개고 각 단계마다 회귀 검증 필요.

---

## 0. 왜 이 작업인가 — 측정 근거

PR #50·#53 적용 후 프로덕션(`hyebinna.com`) 작품 상세 URL, Lighthouse 모바일 실측:

| 지표 | 이미지+폰트 최적화 전 | 후(현재) |
|---|---|---|
| Performance | 58 | 68 |
| **LCP** | 14.8s | **7.5s** |
| FCP | 3.9s | 2.7s |
| Speed Index | 8.9s | 5.2s |
| 폰트 전송량 | 1,656KB/111 | 711KB/2 |
| 총 전송량 | 2,346KB | 1,382KB |

**남은 병목은 바이트가 아니라 "렌더 시작 시점"이다.** 작품 이미지(AVIF 12~43KB)는 네트워크상 ~2.7s에 도착하는데 LCP paint는 7.5s에 잡힌다. 그 간극 ~5s가 아래 waterfall이다.

---

## 1. 병목 진단 — 현재 렌더 경로

홈/상세 모두 클라이언트에서 렌더되고 데이터도 클라이언트에서 받는다.

```
HTML(빈 셸) 도착
  → JS 번들 로드/파싱 (Script 482KB)
  → React hydration
  → CategoriesProvider: useCategories() Firebase 클라이언트 SDK 호출 → 응답까지 스피너
  → page.tsx: searchParams.workId 있으면 WorkDetailPage 마운트
  → WorkDetailPage: useWork(workId) Firebase 호출 → 응답
  → 미디어 렌더 → next/image 요청 → framer-motion opacity 0→1 페이드
  → 비로소 LCP paint
```

근거 (코드):
- `front/app/page.tsx` — `'use client'` + `export const dynamic = 'force-dynamic'`. `workId` 없으면 본문 없음, 있으면 `WorkDetailPage` 조건부 렌더.
- `front/app/works/WorkDetailPage.tsx` — `'use client'`. `useWork(workId)`로 상세를 **클라이언트에서** 조회.
- `front/src/state/contexts/CategoriesContext.tsx` — 초기 카테고리를 클라이언트에서 받고, 받기 전까지 레이아웃이 스피너.
- `front/src/data/api/worksApi.ts` — `firebase/firestore`의 `getDocs`/`getDoc`. **서버 사전 페칭 경로 없음**(클라이언트 전용).
- `front/app/layout.tsx` — 서버 컴포넌트 셸이지만 전체를 클라이언트 Provider로 감싸 사실상 CSR.

즉 **데이터 왕복 2회(categories, work)가 hydration 이후에야 시작**되고, 그 뒤에 이미지·페이드가 붙는다. 이미지/폰트를 더 줄여도 이 순서가 LCP 하한을 만든다.

---

## 2. 개선 레버 (효과 · 위험 · 노력)

### Tier A — 저위험, 코드 국소 (먼저)
1. **LCP 이미지 fade-in 제거/완화**
   - `FadeInImage`의 opacity 0→1 애니메이션이 "콘텐츠 paint"를 지연시킨다. 최소한 **첫 이미지(priority)** 는 페이드 없이 즉시 표시(또는 `imageLoaded` 게이트 제거).
   - 효과: LCP Render Delay 직접 감소. 위험: 시각적 전환 변화(첫 이미지만이라 영향 작음).
2. **Firestore 호출 직렬화 제거**
   - categories와 work을 **병렬**로 시작(현재 categories가 먼저 게이트). `WorkDetailPage`가 categories 완료를 기다리지 않도록 확인.
   - 효과: 데이터 단계 1회 왕복으로 단축.

### Tier B — 중위험, 데이터 계층 추가 (핵심)
3. **상세 데이터 서버 사전 페칭(RSC/route handler) + hydration**
   - 작품 상세를 **서버에서** 먼저 읽어 HTML에 LCP `<img>`(srcSet 포함)를 심으면, 브라우저가 hydration 전에 이미지를 발견·로드 시작 → Load Delay 제거, `priority` preload가 실효.
   - 구현 옵션:
     - (a) **Firestore REST를 서버에서 호출**(서버 컴포넌트/route handler). 클라이언트 SDK 대신 REST(`firestore.googleapis.com/v1/...`)를 `fetch`로 — 공개 read 규칙이라 인증 불필요. `next: { revalidate }`로 ISR 캐시.
     - (b) Firebase Admin SDK 서버 사용(서비스 계정 필요 → 비공개 키 관리 비용).
   - **권장: (a) REST + ISR.** 기존 클라이언트 페칭은 hydration 후 동기화로 유지(TanStack Query `initialData`로 주입).
   - 효과: LCP의 Load Delay(~1.9s) + 데이터 왕복 제거가 가장 큼. 위험: SSR/CSR 데이터 일치, `force-dynamic` 해제 영향, SEO/캐시 정책 재설계.
4. **카테고리 초기 데이터 서버 주입**
   - `CategoriesProvider`에 서버에서 읽은 초기 카테고리를 `initialData`로 전달 → 첫 스피너 제거.

### Tier C — 구조 재정비 (선택)
5. 홈을 `force-dynamic` SPA에서 **route 기반**(`/works/[id]`)으로 분리해 상세를 정적/ISR 프리렌더. URL 구조 변경 → 광범위 회귀, 별도 검토.

---

## 3. 실행 단계 (Phase별 commit + 측정)

각 Phase 후 `npm run build`·lint 통과 + **프로덕션 배포 후 Lighthouse 재측정**으로 효과 확인(로컬은 옵티마이저/데이터 제약).

- [ ] **Phase A1 — 첫 이미지 fade-in 제거** (Tier A-1)
- [ ] **Phase A2 — categories/work 병렬화 확인·수정** (Tier A-2)
- [ ] **Phase B1 — 상세 데이터 서버 REST 사전 페칭 + `initialData` hydration** (Tier B-3) ← 최대 효과
- [ ] **Phase B2 — 카테고리 초기 데이터 서버 주입** (Tier B-4)
- [ ] **Phase C(선택) — route 분리/ISR 프리렌더** (Tier C-5)

---

## 4. 제약·주의

- **AS-IS 동작 보존**: URL 구조(`?keywordId=&workId=`), 모달/상세 전환, 줌 원본, 카테고리 인터랙션 모두 유지. 특히 Tier B는 데이터 이중 경로(서버 초기 + 클라이언트 동기화)의 **불일치/깜빡임** 회귀를 막아야 한다.
- **새 업로드 즉시 반영(클라이언트 절대 제약)**: 서버 사전 페칭에 ISR/`revalidate`를 쓰면 캐시 TTL만큼 지연될 수 있다. → `revalidate` 짧게 잡거나 `revalidateTag`/on-demand revalidation 또는 클라이언트 재검증으로 보완. 업로드는 새 UUID URL이라 이미지 자체는 안전하지만, **목록/상세 메타데이터**는 캐시 정책 점검 필요.
- **Firestore 보안 규칙**: 서버 REST 호출도 공개 read 범위 내에서만. 비공개 필드 노출 금지.
- **측정**: 단일 Lighthouse run은 LCP 편차가 있으니 3회 중앙값. 동일 상세 URL 고정 비교.

---

## 5. 기대 효과 (가설)

| 단계 | 예상 LCP |
|---|---|
| 현재(이미지+폰트 후) | 7.5s |
| +Tier A (fade 제거·병렬화) | ~6s |
| +Tier B (서버 사전 페칭) | ~3~4s |
| +Tier C (ISR 프리렌더) | <2.5s ("좋음") |

> 핵심은 **Tier B(서버 사전 페칭)**. 이미지/폰트로 바이트는 이미 최소화했으니, 이제 "언제 렌더가 시작되는가"를 당기는 것이 남은 LCP의 대부분을 좌우한다.

---

## 부록: 완료된 선행 작업 측정값 (참조)

- 이미지: 원본 760KB → AVIF w640 14KB(98%↓), 31일 엣지캐시 `x-vercel-cache` MISS→HIT 검증. (PR #50, `tasks/web-image-speed-10x-plan.md`)
- 폰트: 나눔명조 KS-2350 서브셋 self-host, 1,656KB/111 → 711KB/2 (57%↓), LCP 14.8→7.5s. (PR #53)
