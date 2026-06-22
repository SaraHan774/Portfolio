# 이미지 로딩 최적화 계획

> **목표**: 클라이언트가 보고한 "이미지 로딩이 느림"(특히 모바일)을 해소한다.
> **제약**: 현재 동작(AS-IS)과 비즈니스 로직을 변경하지 않는다. **순수 성능 최적화만** 수행한다.
> **범위**: `front` (Next.js, Vercel 배포)만 수정. `admin` 업로드 파이프라인·Firestore 데이터·재업로드 불필요.

---

## 진단 요약

front는 **Vercel에 배포**되어(`vercel.json` + `next start`, `output: export` 아님) **Next.js 이미지 최적화가 프로덕션에서 완전히 동작**한다. 따라서 새 이미지 변형(medium)을 admin에서 생성할 필요 없이, front에서 Next에게 올바른 힌트만 주면 화면 크기에 맞는 WebP/AVIF가 즉석 생성된다.

### 핵심 병목

모달 본문 이미지(가장 크고 가장 많이 노출되는 이미지)는
`WorkModal/WorkModalMobile → ModalImage → FadeInImage → next/image` 경로로 렌더된다.

`FadeInImage`(`front/src/presentation/ui/media/FadeInImage.tsx`)는
- `width`/`height`를 **원본 치수(최대 1920px)** 로 전달하고
- **`sizes` 속성이 없다.**

`next/image`에서 `fill`이 아닌 이미지에 `sizes`가 없으면 Next는 **`width`의 1x·2x srcSet만** 생성한다. 즉 `width=1920`이면 모바일(DPR 2~3)이 **1920~3840px** 이미지를 ~360px 화면에 다운로드한다 → **모바일 5~10배 과대 전송.** 이것이 체감 느림의 핵심 원인이다.

### 부차 병목
- `next.config.ts`에 `formats`(AVIF) / `deviceSizes` / `imageSizes` 미설정.
- 모달 첫 이미지(LCP 후보)에 `priority` 미적용.
- `FloatingWorkWindow`가 `<img>` 직접 사용 → Next 최적화/포맷 변환 우회.

---

## 실행 단계 (Phase별 commit)

각 Phase 완료 시 lint 통과 확인 후 commit 하고 아래 체크박스를 갱신한다.

- [x] **Phase 0 — 계획 문서 작성**
  - `tasks/image-optimization-plan.md` 추가 (본 문서).

- [x] **Phase 1 — `next.config.ts` 이미지 옵션 강화** (설정만, 동작 무변경)
  - `formats: ['image/avif', 'image/webp']` 추가 → WebP 대비 추가 20~30% 절감.
  - `deviceSizes` / `imageSizes`를 실제 브레이크포인트에 맞춰 명시 → 불필요한 대형 변형 생성 억제.
  - 기존 `remotePatterns`, `dangerouslyAllowSVG`, `unoptimized`(emulator) 그대로 유지.

- [x] **Phase 2 — `FadeInImage` + `ModalImage`에 `sizes` 전달** (최대 효과)
  - `FadeInImage`에 `sizes?: string` prop 추가 → 내부 `<Image>`에 전달(없으면 기존 동작 유지).
  - `ModalImage`에 `sizes?: string` prop 추가, 기본값 `(max-width: 768px) 100vw, 60vw`.
  - 모바일은 viewport 폭 기준(~640~750px), 데스크톱은 이미지 컬럼 폭 기준 변형을 수신.
  - 확대(zoom)는 별도 `ImageZoomOverlay`가 원본을 사용하므로 디테일 손실 없음.

- [x] **Phase 3 — LCP 이미지 `priority` 적용**
  - `ModalImage`에 `priority?: boolean` prop 추가 → `FadeInImage`로 전달.
  - `WorkModal` / `WorkModalMobile`에서 미디어 배열 **첫 항목(index 0)** 에만 `priority` 부여, 나머지는 기존 lazy 유지.

- [x] **Phase 4 — `FloatingWorkWindow` `<img>` → `next/image`**
  - 80×80 컨테이너에 `next/image`(`fill` + `sizes="80px"`) 사용 → Next 최적화/포맷 변환 적용.
  - 기존 스켈레톤·fade-in·`objectFit: contain` 동작 유지.

- [ ] **Phase 5 — 최종 검증**
  - `npm run lint` + `npm run build` 통과 확인.

---

## 변경하지 않는 것 (의도적 보류)

비즈니스 로직/동작 변경 위험이 있어 본 작업 범위에서 제외한다.

- admin 업로드 파이프라인(`processImage` medium 변형 연결, WebP/AVIF 사전 생성) — Vercel 최적화로 대체되므로 불필요.
- `WorkImage.listThumbnailUrl` / `webpUrl` 미사용 필드 및 `components/media/FadeInImage.tsx` 중복본 정리 — 별도 정리 PR 대상.
- `dangerouslyAllowSVG` 재검토 — 보안 이슈는 별도 트랙.
- blur placeholder 도입 — 로딩 UX(현재 지연 스켈레톤) 변경에 해당하므로 제외.

---

## 기대 효과

| 항목 | 변경 전 (모바일) | 변경 후 (모바일) |
|---|---|---|
| 모달 이미지 전송 | ~1920px WebP (또는 2x) | ~640~750px AVIF |
| 추정 페이로드 절감 | — | **70~85%↓** |
| LCP | lazy | priority |
| 데이터/재업로드 | — | **불필요** |
