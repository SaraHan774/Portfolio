# 계획서 ②: SSR / 이미지 preload

> 상태: **초안 (구현 보류)**
> 난이도: 높음 · 디자인 변화: 없음 · Storage 비용: 0

## 1. 목표

URL에 `workId`가 있는 첫 진입(직접 링크/새로고침/공유)에서, **서버가 첫 이미지 URL을 미리 알아내** HTML `<head>`에 `<link rel="preload" as="image">`를 주입한다. 브라우저가 JS 하이드레이션을 기다리지 않고 **첫 이미지를 즉시 다운로드 시작**.

- 워터폴의 "JS 번들 → 하이드레이션 → useWork 쿼리 → Firestore getDoc" 구간을 **첫 이미지에 한해 통째로 제거**.
- 디자인·비용 변화 없음. 현재 스켈레톤·fade 그대로, 실이미지 도착만 앞당김.

> 적용 범위는 **첫 진입(SSR이 의미 있는 시점)**. SPA 내부 클라이언트 네비게이션(목록 클릭)은 prefetch(①③)가 담당.

## 2. 제약 (조사 결과)

- `firebase-admin` 없음. 현재 데이터는 **클라이언트 firebase SDK**(`getDoc`)로만 읽음 — 서버에서 그대로 호출 불가.
- 상세는 별도 라우트가 아니라 `app/page.tsx`(현재 `'use client'`)에서 `useSearchParams()`로 `workId`를 읽어 조건부 렌더.
- 따라서 두 가지를 풀어야 한다: **(A) 서버에서 첫 이미지 URL 확보** + **(B) 서버 렌더 경계에서 preload 링크 주입**.

## 3. (A) 서버에서 첫 이미지 URL 확보 — 옵션

| 옵션 | 방법 | 장점 | 단점 |
|------|------|------|------|
| **A1. Firestore REST API** ✅ 추천 | 서버에서 `https://firestore.googleapis.com/v1/projects/{pid}/databases/(default)/documents/works/{id}` GET | `firebase-admin` 불필요, 가장 가벼움, fetch 한 번 | 공개 읽기 보안 규칙 전제, 응답 매핑 별도 |
| A2. firebase-admin 도입 | 서버 SDK로 인증된 읽기 | 정석, 비공개 데이터도 가능 | 의존성·서비스계정 키 관리, 콜드스타트 무게 |
| A3. 클라이언트 SDK를 서버에서 호출 | RSC에서 firebase JS SDK `getDoc` | 코드 재사용 | Node 환경 지원 불안정, 권장도 낮음 |

- **추천: A1**. 이 사이트는 공개 포트폴리오라 `isPublished` 문서는 공개 읽기일 가능성이 높음 → **보안 규칙 확인 필요(확정 항목)**.
- 서버에서 필요한 건 **첫 이미지 1장의 url·width·height뿐**. 전체 문서를 받되 매핑은 최소화.
- 서버 결과는 클라이언트 React Query 캐시에 dehydrate로 전달하면 ①과 시너지(하이드레이션 직후 추가 fetch 불필요).

## 4. (B) preload 링크 주입

- `app/page.tsx`를 **서버 컴포넌트로 분리**: 서버 컴포넌트가 `searchParams.workId`를 받아(서버에서 사용 가능) preload 링크를 렌더하고, 인터랙티브 UI는 클라이언트 자식으로 내림.
  - 현재 page가 `useSearchParams` 기반 클라이언트라 **경계 리팩토링**이 핵심 작업.
  - 대안: Next `generateMetadata` 또는 서버 컴포넌트에서 `<link>`를 직접 렌더.
- preload URL은 **next/image가 실제 요청할 변형 URL과 일치**해야 캐시 적중:
  ```html
  <link
    rel="preload"
    as="image"
    imagesrcset="/_next/image?url=<enc>&w=640&q=72 640w, .../w=1080&q=72 1080w, ..."
    imagesizes="(max-width: 767px) 100vw, (max-width: 1199px) 60vw, 50vw"
    fetchpriority="high"
  />
  ```
  - `q`는 `DETAIL_IMAGE_QUALITY(72)`, `imagesizes`는 `DETAIL_IMAGE_SIZES`와 동일하게.
  - `deviceSizes`(384/640/750/828/1080/1200/1920)에 맞춰 srcset 구성 → 브라우저가 뷰포트에 맞는 변형만 받음.
- 모바일/데스크톱 모두 동일 링크로 커버(imagesizes가 분기 처리).

## 5. 단계

1. 보안 규칙 확인: `works` 공개 읽기 가능 여부 → A1 가능성 확정.
2. 서버 유틸 `getFirstImageForPreload(workId)` 작성 (A1, REST fetch + 최소 매핑).
3. `app/page.tsx` 서버/클라이언트 경계 분리, `searchParams` 서버 수신.
4. 서버 컴포넌트에서 preload `<link>` 렌더(첫 이미지 변형 URL 구성 유틸 포함).
5. (선택) 서버에서 읽은 상세를 React Query dehydrate로 전달.
6. Lighthouse로 첫 진입 LCP 비교.

## 6. 리스크 / 주의

- **변형 URL 불일치 시 이중 다운로드**: preload한 URL과 next/image 실제 요청이 다르면 낭비. `w/q/sizes`를 한 곳에서 상수로 공유해 일치 보장.
- **경계 리팩토링 범위**: page가 클라이언트 상태(useSearchParams, 모달 등)에 깊게 얽혀 있어 분리 난이도 있음. 최소 침습으로 preload 링크만 서버에서 추가하는 방향 우선.
- **보안 규칙**: A1이 막히면 A2(firebase-admin)로 승격 필요 — 의존성·키 관리 작업 추가.
- force-dynamic 유지: 매 요청 서버 fetch 1회 추가(첫 이미지 메타). 가벼운 단일 문서라 부담 낮음.

## 7. 검증 — 측정 가능한 벤치마크

> 합격 기준 전문: [BENCHMARKS.md §4 ②](./BENCHMARKS.md#4-plan별-합격-기준-pass-gate)

**Pass gate (cold, 5회 중앙값):**
- **LCP·Load Delay: 4,332ms → ≤ 1,500ms** (CSR 워터폴 제거 → TTFB+α 수준).
- **LCP 총합: baseline 대비 ≥ 25% 단축**.
- preload URL과 next/image 실제 요청 URL **일치**(중복 변형 다운로드 0).

**측정 절차:**
```bash
cd docs/plans/first-image-loading
./measure-lcp.sh "<workId URL>" baseline-cold 5   # 착수 전
./measure-lcp.sh "<workId URL>" ssr-cold 5        # 구현 후
```
- HTML 소스(view-source)에 첫 이미지 `<link rel="preload" as="image">` 존재 확인.
- 네트워크 워터폴에서 첫 이미지 요청이 JS 번들/하이드레이션 **이전** 시작인지 육안 확인.
- `summary.json`의 `LCP_LoadDelay_median` / `LCP_ms_median`으로 게이트 판정.

## 8. 롤백

- preload 링크 렌더 제거 + 서버 fetch 비활성화로 원복. 경계 분리는 남겨도 무해.
