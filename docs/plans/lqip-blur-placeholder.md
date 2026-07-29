# 계획서: LQIP 블러 플레이스홀더 도입

> 상태: **초안 (구현 보류)**
> 작성일: 2026-06-23
> 목표: 상세 화면에서 **첫 이미지가 뜨는 체감 로딩 속도** 개선

---

## 1. 배경 / 문제

현재 상세 화면의 이미지 로딩 체감 흐름은 다음과 같다.

```
빈 화면 (수백 ms ~ 1.2s) → 스켈레톤 시머 → 실제 이미지 fade-in
```

- `FadeInImage`는 `placeholder` 없이 `next/image`를 쓰고, 로딩이 1.2초(`SKELETON_DELAY_MS`)를 넘겨야 스켈레톤을 띄운다.
- 그 전까지는 **레이아웃 박스만 있고 아무 형상이 없어** "비어 있다"는 인상을 준다.
- 실제 다운로드 시간을 줄이지 않더라도, **0ms에 흐릿한 형상**을 먼저 보여주면 체감 속도가 크게 개선된다 (LQIP 기법).

## 2. 접근 방식

업로드 시점에 **초저해상도(가로 ~20px) 블러 이미지를 base64 data URL로 생성**해 Firestore 문서에 인라인 저장하고, front에서 `next/image`의 `placeholder="blur"` + `blurDataURL`로 사용한다.

- 별도 Storage 업로드/네트워크 요청 없음 — data URL이 작품 데이터(JSON)에 함께 실려 온다.
- admin이 이미 Canvas로 썸네일을 만들고 있어, **같은 1회 디코딩 파이프라인에 변형 하나만 추가**하면 된다.

### 왜 data URL 인라인인가

| 방식 | 장점 | 단점 | 채택 |
|------|------|------|------|
| **base64 data URL 인라인 (Firestore)** | 추가 네트워크 0회, 데이터와 함께 즉시 도착 | 문서 크기 약간 증가 | ✅ |
| Storage에 별도 LQIP 파일 업로드 | 문서 가벼움 | 첫 형상까지 네트워크 1회 추가 → 체감 개선 효과 반감 | ✗ |
| front 런타임에 thumbnailUrl fetch 후 생성 | 데이터 모델 변경 없음 | CORS·디코딩·네트워크 추가, 복잡 | ✗ |

### data URL 크기 가늠

- 가로 약 20px(비율 유지) WebP/JPEG → 대략 **0.3~1KB / 장**.
- 한 작품 이미지 수가 많아도 Firestore 1MB 문서 한도 대비 여유. (예: 30장 × 1KB ≈ 30KB)
- 단, 안전장치로 생성 후 길이를 검증하고 상한(예: 2KB)을 넘으면 품질/크기를 더 낮춘다.

## 3. 데이터 모델 변경

`WorkImage`에 선택 필드 추가 — **front / admin 양쪽 동일하게**.

```ts
export interface WorkImage {
  // ...기존 필드
  /** LQIP 블러 플레이스홀더 (base64 data URL, 가로 ~20px). 신규 업로드부터 채워짐 */
  blurDataURL?: string;
}
```

- 위치
  - front: `front/src/core/types/work.types.ts`
  - admin: `admin/src/core/types/api.ts`
- **선택값**으로 둬서 기존 데이터(필드 없음)와 호환. 없으면 front는 기존 스켈레톤 fallback.

## 4. 변경 대상 파일

### admin (생성·저장)

| 파일 | 변경 내용 |
|------|-----------|
| `admin/src/core/utils/image.ts` | `processImage()`에 LQIP 변형 생성 추가 — Canvas로 가로 ~20px 축소 후 `toDataURL`. 결과를 반환 객체에 `blurDataURL`로 포함. 크기 상한 검증 포함 |
| `admin/src/data/api/storageApi.ts` | `uploadImage()`에서 `processImage` 결과의 `blurDataURL`을 `WorkImage`에 실어 반환 |
| `admin/src/core/utils/imageUploadMerge.ts` | `mergeUploadedImages()`에서 temp→real 병합 시 `blurDataURL` 승계 |
| `admin/src/core/types/api.ts` | `WorkImage.blurDataURL` 추가 |
| (저장 sanitize 지점) `admin/src/pages/WorkForm.tsx` | `sanitizedImages` 구성 시 `blurDataURL` 누락되지 않도록 확인 |

### front (소비)

| 파일 | 변경 내용 |
|------|-----------|
| `front/src/core/types/work.types.ts` | `WorkImage.blurDataURL` 추가 |
| `front/src/presentation/ui/media/FadeInImage.tsx` | `blurDataURL?` prop 추가 → 있으면 `next/image`에 `placeholder="blur"` + `blurDataURL` 전달. 있을 때는 커스텀 스켈레톤/opacity 게이트 비활성화 |
| `front/app/works/WorkDetailPage.tsx` | 인라인 `FadeInImage`에 `blurDataURL={item.data.blurDataURL}` 전달 (경로 1) |
| `front/src/presentation/components/work/ModalImage.tsx` | `FadeInImage`에 `blurDataURL={image.blurDataURL}` 전달 (경로 2) |

> ⚠️ **이중 렌더 경로**: 상세 화면 인라인(`WorkDetailPage`)과 모달(`ModalImage`) 두 곳 모두 수정해야 함. ([[front-detail-two-image-render-paths]])

## 5. FadeInImage 렌더 로직 정리

`blurDataURL` 유무에 따라 동작을 분기한다.

- **blurDataURL 있음**:
  - `<Image placeholder="blur" blurDataURL={...} />` → next/image가 0ms에 흐릿한 형상 표시.
  - 커스텀 스켈레톤(`showSkeleton`)·`SKELETON_DELAY_MS` 타이머 미사용.
  - opacity fade 게이트도 불필요(블러가 자연스러운 전환을 대체). priority 여부와 무관하게 즉시 표시.
- **blurDataURL 없음 (기존 데이터)**:
  - 현재 동작 그대로 유지(스켈레톤 + fade).

이렇게 하면 신규/기존 이미지가 한 컴포넌트에서 자연스럽게 공존한다.

## 6. 기존 데이터 백필 전략

신규 업로드는 자동으로 채워지지만, **기존 작품 이미지는 `blurDataURL`이 없다.**

- **1단계(기본)**: 백필 없이 출시. 기존 이미지는 fallback(스켈레톤)으로 동작, 신규 업로드부터 LQIP 적용. → 위험 낮고 즉시 가능.
- **2단계(선택)**: 일회성 마이그레이션. admin에서 기존 `images[].url`(또는 `thumbnailUrl`)을 불러와 Canvas로 LQIP 생성 후 문서 갱신.
  - 주의: Firebase Storage CORS 설정 필요(Canvas `toDataURL`는 cross-origin 이미지에서 tainted canvas 오류 발생 가능). `crossOrigin="anonymous"` + Storage CORS 허용 확인.
  - 범위가 크면 별도 작업으로 분리.

## 7. 리스크 / 엣지 케이스

- **문서 크기 팽창**: 이미지 다수 작품에서 누적. → 생성 시 길이 상한 검증, 가로 16~20px 유지.
- **Tainted canvas (백필 시)**: cross-origin 제약. 신규 업로드 경로는 로컬 File이라 무관, 백필만 해당.
- **placeholder="blur"의 width/height 요구**: 우리는 명시적 width/height를 넘기므로 충족.
- **빈/실패 생성**: LQIP 생성 실패 시 `blurDataURL`을 비워 두고 fallback으로 동작(throw 금지).
- **테스트 영향**: `FadeInImage`·`ModalImage` 스냅샷/렌더 테스트에 prop 추가 반영.

## 8. 테스트 계획 / 측정 가능한 벤치마크

> 합격 기준 전문: [BENCHMARKS.md §4 ④](./first-image-loading/BENCHMARKS.md#4-plan별-합격-기준-pass-gate)

**단위 테스트:**
- admin: `processImage()`가 유효한 data URL과 상한 이하 길이를 반환하는지.
- admin: `mergeUploadedImages()`가 `blurDataURL`을 승계하는지.
- front: `FadeInImage`가 `blurDataURL` 있을 때 `placeholder="blur"`로, 없을 때 스켈레톤 경로로 렌더되는지.

**Pass gate (주의: LCP 요소는 실이미지라 LCP만으로 판정 금지):**
- 첫 형상(블러) paint **≤ FCP 근처**(스켈레톤 1.2s 지연 제거 — 트레이스/스크린샷 타임라인으로 확인).
- 추가 전송량 **장당 ≤ 2KB**(인라인 data URL 상한), 문서 크기 회귀 없음.
- LCP·Speed Index **악화 없음(±5% 이내)** — `measure-lcp.sh`로 before/after 중앙값 대조.

## 9. 작업 순서(예정)

1. 타입 추가(front/admin `WorkImage.blurDataURL`).
2. admin `processImage` LQIP 생성 + `storageApi`/`mergeUploadedImages` 배선.
3. front `FadeInImage` 분기 로직.
4. front 두 렌더 경로에 prop 전달.
5. 테스트 추가/수정.
6. 수동 검증(신규 업로드 1건) + Lighthouse 비교.
7. (선택) 기존 데이터 백필 별도 진행.

## 10. 롤백

- 데이터 필드는 선택값이라 그대로 둬도 무해.
- front에서 `blurDataURL` 전달만 제거하면 즉시 기존 동작으로 복귀.
```
