# 설계: ISR 엣지 캐싱 + on-demand revalidation

> 상태: **구현 중**
> 목표: 한국 사용자의 매 요청이 미국동부(iad1) 함수까지 왕복하던 구조를 제거해 셸을
> 서울 엣지에서 캐시 서빙. 신선도는 on-demand revalidation으로 보장.

## 측정 근거 (Preview 배포, 한국)
- BEFORE(force-dynamic): TTFB **473ms**, `x-vercel-cache: MISS`, `icn1::iad1`.
- AFTER(정적/ISR): TTFB **46ms**, `HIT`, `icn1`(iad1 사라짐). **~10배, 요청당 ~425ms 절약.**

## 핵심 진단
루트 `layout.tsx`의 `export const dynamic = 'force-dynamic'`이 **전 라우트를 동적으로 강제** →
엣지 캐시 무력화 → 매 요청 미국 함수 왕복. "Firebase 느림"이 아니라 **렌더 전략**이 원인.

## 무엇이 셸에 들어가나 (캐시 대상)
| 데이터 | 현재 | ISR 후 |
|---|---|---|
| 카테고리 네비 | 레이아웃 SSR 프리페치+하이드레이션 | **빌드/재검증 시 1회** 읽어 캐시 |
| 사이트 설정(메타 description) | `generateMetadata`서 매 요청 | **빌드/재검증 시** |
| 작품 목록/상세 | **CSR**(React Query) | **CSR 그대로** (변경 없음) |

→ 작품은 이미 클라이언트에서 신선하게 로드되므로 ISR 셸에 없음. **셸 캐시가 작품 신선도에 영향 없음.**
→ 셸 신선도가 필요한 건 **카테고리/사이트설정 변경 시**뿐 → on-demand revalidation으로 처리.

## 변경 설계

### front
1. `app/layout.tsx` — `force-dynamic` 제거. (카테고리 프리페치/`generateMetadata`는 빌드·재검증 시 실행)
2. `app/page.tsx` — `force-dynamic` 제거 + `export const revalidate = 300`(5분 안전망).
   `useSearchParams`는 이미 `<Suspense>` 안 → 정적 셸 + 클라이언트에서 workId 처리(모달/상세) 유지.
3. `app/api/revalidate/route.ts` (신규) — `POST`, 시크릿 헤더 검증 후 `revalidatePath('/')`.
   admin이 다른 오리진이므로 CORS(OPTIONS) 허용. 시크릿은 `REVALIDATE_SECRET`(서버 env).

### admin
4. `src/data/.../revalidate.ts` (신규) — `triggerFrontRevalidation()`: 프론트 revalidate 엔드포인트로
   `POST`. env(`VITE_FRONT_REVALIDATE_URL`,`VITE_REVALIDATE_SECRET`) 없으면 **no-op**(graceful).
5. 호출 지점 — 카테고리/사이트설정/작품 **발행·수정·삭제 성공 후** 호출(실패해도 본 작업은 성공 유지).

## 신선도 모델
- **주 메커니즘**: admin 발행 시 on-demand revalidation → 다음 요청이 셸 재생성(즉시 반영).
- **안전망**: `revalidate = 300` → on-demand가 누락돼도 5분 내 자동 갱신.
- 작품: CSR이라 별도 불필요(클라이언트 staleTime로 신선).

## 리스크 / 검증
- `/`가 정적이 되어도 `useSearchParams`(workId)·모달·작품목록이 정상인지 → 빌드 라우트 타입(○/ISR) + Preview 배포로 확인.
- 빌드 시 카테고리/설정 Firebase 읽기 필요(Vercel 빌드 env에 키 존재 — Preview 빌드 성공으로 확인됨).
- 시크릿이 admin(브라우저 SPA)에 노출 → admin은 Google OAuth 비공개 + revalidation은 idempotent·무해. 수용.
- 검증: front/admin build·lint·test green → Preview 배포 → 한국 TTFB before/after 재측정.

## 적용 시 필요한 env (배포자 설정)
- front(Vercel): `REVALIDATE_SECRET`
- admin: `VITE_FRONT_REVALIDATE_URL`(프론트 `/api/revalidate`), `VITE_REVALIDATE_SECRET`(동일 값)
