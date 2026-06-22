# 이미지 캡션 기능 구현 계획

> 작성일: 2026-06-22 (코드 검증 후 갱신)
> 브랜치: `feature-image-caption`
> 스펙 출처: 클라이언트(XXX) 요청 — `KakaoTalk_Photo_2026-06-22-22-20-53.jpeg`

---

## 1. 목표 (Goal)

**카테고리(키워드)를 클릭해 진입하는 작품 상세 화면**에서, 세로로 나열되는 **각 이미지 아래에 한 줄짜리 캡션 텍스트**를 표시할 수 있게 한다.
예: `사진_XXX` 같은 사진 출처/설명 문구.

### 스펙 원문 요약

> - "사진 아래쪽에 텍스트를 적을 수 있는 설정칸 한 줄이 필요합니다."
> - "캡션과 같은 색, 이메일 적은 텍스트와 같은 폰트크기로."
> - "사진마다 정보를 적을 수 있게 설정하되 공백으로 남겨두는 것도 가능하게 관리할 수 있으면 좋을 것 같습니다!"

### 요구사항 분해

| # | 요구사항 | 해석 |
|---|----------|------|
| R1 | 사진 아래 한 줄 텍스트 입력칸 | **이미지별** 단일 라인 plain text 캡션 필드 |
| R2 | 캡션과 같은 색 | 색상 = 기존 작품 캡션 색상 (`var(--color-gray-700)`) |
| R3 | 이메일 텍스트와 같은 폰트 크기 | 폰트 크기 = Footer 텍스트 (`var(--font-size-xs)`) |
| R4 | 사진마다 설정 | 이미지 단위로 개별 입력 |
| R5 | 공백 허용 | 선택값(optional), 빈 값이면 렌더링하지 않음 |

### 노출 범위 (확정)

- ✅ **작품 상세 화면의 이미지 목록에만** 표시 (PC `WorkModal` + 모바일 `WorkModalMobile`)
- ❌ 작품 목록 썸네일에는 미표시
- ❌ 이미지 클릭 시 뜨는 확대(zoom) 오버레이에는 미표시 (이미지만 확대)

---

## 2. 기존 구조와의 구분 (중요)

이미 존재하는 `Work.caption`과 **혼동 금지**.

| 구분 | 기존 `Work.caption` | 신규 이미지 캡션 (이번 작업) |
|------|--------------------|------------------------------|
| 단위 | 작품(work) 전체 1개 | 이미지마다 1개 |
| 형식 | HTML 리치텍스트 (TipTap) | 단일 라인 plain text |
| 내용 | 규격·재료·작품명 등 설명 | 사진 출처/짧은 캡션 |
| 위치 | 상세 화면 우측 고정 영역 | 각 사진 바로 아래 |
| 구현 상태 | 완료 | **미구현 (이번 작업)** |

→ 신규 필드는 `WorkImage` 타입 안에 추가한다. (네스팅되어 있어 이름 충돌 없음)

---

## 3. 상세 화면 컴포넌트 계층 (코드 검증 완료 · ⚠️ 최초 분석 정정됨)

> ⚠️ **중요 정정**: 처음엔 "메인 상세 = WorkModal → ModalImage"로 봤으나, 실제로는 **메인 상세 화면이 `WorkDetailPage` 안에서 이미지 목록을 직접 인라인 렌더**한다. `WorkModal`/`ModalImage`는 **캡션 링크로 다른 작품을 열 때 뜨는 보조 모달** 전용이다. 따라서 **두 경로 모두** 캡션을 넣어야 한다.

```
카테고리 클릭 → 작품 선택 → URL: /?keywordId=xxx&workId=123
  app/page.tsx (workId 보고 조건부 렌더, :31-42)
    └ app/works/WorkDetailPage.tsx
        │
        ├─ [메인 상세 화면] sortedMedia.map() 인라인 렌더 (:490-547)   ← ✅ 캡션 지점 ①
        │     └ <div data-image-id> → ZoomableImage → FadeInImage
        │       (PC·모바일 공용 — isMobile 분기 없음)
        │
        └─ [보조 모달] modalWorkId 있을 때만 (:567-580)              ← 연관 작품 클릭 시
              ├ WorkModal (PC) / WorkModalMobile (모바일)
              │   └ 이미지 목록 .map() → ModalImage                  ← ✅ 캡션 지점 ②
              │         └ ZoomableImage → FadeInImage
              └ (ZoomableImage 클릭 = 확대 오버레이, 캡션 제외)
```

- **캡션 추가 지점은 두 곳**:
  ① `WorkDetailPage.tsx` 인라인 렌더 (메인 상세, PC·모바일 공용) — **이게 실제 진입 화면**
  ② `ModalImage.tsx` (보조/연관작품 모달, PC·모바일 공용)
- 캡션은 `ZoomableImage`(클릭 영역) **바깥, 이미지 아래**에 배치 → 캡션 클릭 시 확대 안 됨, 확대 오버레이에 캡션 미포함.
- (디버깅 기록: `data-image-id`를 렌더하는 주체가 `ModalImage`가 아니라 `WorkDetailPage:514`임을 헤드리스 DOM 추적으로 확인하여 정정.)

---

## 4. 관련 파일 (검증된 경로/라인)

### 타입 (양쪽 모두 수정)
- `front/src/core/types/work.types.ts:3-14` — `WorkImage`
- `admin/src/core/types/api.ts:20-31` — `WorkImage`

### Admin 입력
- `admin/src/components/ImageUploader.tsx` — 이미지 카드 그리드 (`:286-359`)
- `admin/src/pages/WorkForm.tsx`
  - 🔴 `:279-292` — pending→실제 이미지 **병합부 (caption 소실 버그 지점)**
  - `:387` — `removeUndefinedValues(img)`로 저장 직전 undefined 제거 (빈 캡션 자동 정리)
- `admin/src/data/api/worksApi.ts:34-65` — 유효성 검사
- `admin/src/core/constants/config.ts:43-47` — `text` 상수 (`captionMaxLength` 등)

### Front 표시 (두 곳)
- ✅ ① `front/app/works/WorkDetailPage.tsx:511-545` 인라인 렌더 — **메인 상세 화면 (실제 진입 화면, PC·모바일 공용)**
- ✅ ② `front/src/presentation/components/work/ModalImage.tsx` — 보조/연관작품 모달
- 스타일 기준값:
  - 색상 `var(--color-gray-700)` (기존 캡션, `WorkDetailPage.tsx` renderCaption)
  - 폰트 `var(--font-size-xs)` (Footer 이메일 텍스트)
  - 정렬 `text-align: right` (이미지 아래 **우측 정렬** — 클라이언트 확정)

### Mapper — **변경 불필요 (검증 완료)**
- 이미지 배열은 통째로 불투명하게 통과되므로 `WorkImage`에 필드만 추가하면 caption이 자동으로 흐른다.
  - 쓰기: `admin/.../workMapper.ts:44` → `images: work.images`
  - 읽기: `admin/.../workMapper.ts:20`, `front/.../workMapper.ts:16` → `images: (data.images as WorkImage[]) || []`

---

## 5. 설계 결정

1. **데이터 모델**: `WorkImage`에 `caption?: string` 추가 (optional → R5 충족). 단일 라인 plain text.
2. **저장 위치**: 이미지 객체 자체에 포함 → 순서 변경/삭제 시 캡션이 함께 따라감.
   - 검증: `ImageUploader.tsx`의 reorder/delete는 모두 `{ ...img, order }` 스프레드(`:134, :161, :174, :210`)라 caption 보존됨.
3. **입력 UI**: Ant Design `Input` (단일 라인), 각 이미지 카드 하단. `maxLength` 적용.
4. **표시 위치**: 이미지 바로 아래, **우측 정렬**(`text-align: right`), 빈 값이면 DOM 미출력. 메인 상세(`WorkDetailPage` 인라인)와 보조 모달(`ModalImage`) **두 곳 모두** 적용. (오버레이 아님 — 흐름상 이미지 하단.)
5. **이름**: `caption`으로 통일하되 주석으로 "이미지 단위 캡션"임을 명시.
6. **길이 제한**: `text.imageCaptionMaxLength = 200` 신규 상수 추가.
7. **undefined 처리**: 저장 직전 `removeUndefinedValues`(`WorkForm.tsx:387`)가 빈/미입력 캡션을 제거하므로 Firestore 직렬화 안전.

---

## 6. 구현 단계

### Phase 1 — 타입 & 상수
- [ ] `front/src/core/types/work.types.ts` `WorkImage`에 `caption?: string` 추가
- [ ] `admin/src/core/types/api.ts` `WorkImage`에 `caption?: string` 추가
- [ ] `admin/src/core/constants/config.ts` `text.imageCaptionMaxLength = 200` 추가

> ℹ️ `PendingImage`(`ImageUploader.tsx:20-25`)에는 추가하지 않는다. 캡션은 미리보기용 임시 `WorkImage`(`:86`)에 저장되어 `images` 상태로 관리되는 것이 맞다. `PendingImage`는 업로드용 `File` 참조 전용.

### Phase 2 — Admin 입력 UI
- [ ] `admin/src/components/ImageUploader.tsx`: 각 이미지 카드(`:323` 액션 영역 부근)에 단일 라인 `Input` 추가
  - placeholder 예: `"사진 캡션 (선택, 예: 사진_XXX)"`, `maxLength={200}`
  - `onChange` → 해당 `images[index]`의 `caption` 갱신 후 `onChange(newImages)` 호출 (PendingImage 경로 아님)
- [ ] `admin/src/pages/WorkForm.tsx`: 변경 감지(`hasChanges`, `:111-138`)에 이미지 캡션 변경 반영

### Phase 3 — 🔴 저장 병합 버그 수정 (필수)
- [ ] `admin/src/pages/WorkForm.tsx:283` — pending 이미지가 실제 이미지로 교체될 때 caption 승계
  ```ts
  // 현재 (caption 소실):
  return { ...real, order: img.order };
  // 수정:
  return { ...real, order: img.order, caption: img.caption };
  ```
  > 이유: 신규 업로드 이미지의 캡션은 임시 `WorkImage`(`img`)에 저장되는데, 병합이 `real`만 스프레드하고 `order`만 승계해 **저장 시 캡션이 사라진다**. 기존 이미지 캡션 수정은 `:289 return img`로 보존되어 영향 없음 — 오직 "이번 세션에 새로 올린 이미지"만 해당.

### Phase 4 — Admin 유효성 검사
- [ ] `admin/src/data/api/worksApi.ts`: 각 이미지 `caption` 길이 검증 (`imageCaptionMaxLength` 초과 시 `ValidationError`)

### Phase 5 — Front 표시 (두 곳 모두)
- [x] ① `front/app/works/WorkDetailPage.tsx:511-545` 인라인 렌더 — **메인 상세 화면** (`ZoomableImage` 블록 아래에 `item.data.caption` 출력)
- [x] ② `front/src/presentation/components/work/ModalImage.tsx` — 보조/연관작품 모달 (`ZoomableImage` 블록 아래에 `image.caption` 출력)
  - 두 곳 모두 caption이 truthy일 때만 렌더 (R5)
  - 스타일 (R2, R3):
    ```css
    font-size: var(--font-size-xs);   /* 이메일 텍스트와 동일 */
    color: var(--color-gray-700);     /* 기존 캡션과 동일 */
    line-height: var(--line-height-normal);
    margin-top: var(--space-2);
    text-align: right;                /* 이미지 아래 우측 정렬 (클라이언트 확정) */
    ```
  - plain text이므로 React 기본 이스케이프 사용. `dangerouslySetInnerHTML` 금지.

> ⚠️ **메인 상세는 `ModalImage`가 아니라 `WorkDetailPage` 인라인 렌더**다(섹션 3 참고). 둘 다 수정하지 않으면 메인 진입 화면에 캡션이 안 보인다 — 실제로 겪은 버그.
> ℹ️ 메인 인라인 렌더는 `isMobile` 분기가 없어 PC·모바일 공용. `ModalImage`도 WorkModal/WorkModalMobile 공유. → 모바일 별도 작업 불필요.

### Phase 6 — 테스트
- [ ] Mapper 통과 테스트: 이미지 `caption` 있음/없음 라운드트립 (필드 추가만으로 흐르는지 확인)
- [ ] 🔴 **회귀 테스트(필수)**: 신규 업로드 이미지에 캡션 입력 → `uploadPendingFiles` 병합 후에도 caption 보존 (Phase 3 검증)
- [ ] `ImageUploader` 테스트: 캡션 입력 시 `images` 상태/`onChange` 반영
- [ ] `ModalImage` 테스트: 캡션 있으면 표시, 없으면 미표시
- [ ] `worksApi` 검증 테스트: 길이 초과 시 `ValidationError`

---

## 7. 엣지 케이스 & 마이그레이션

- **기존 데이터**: 기존 이미지엔 `caption` 없음 → optional이라 정상. DB 마이그레이션 불필요.
- **빈 문자열 vs undefined**: 저장 직전 `removeUndefinedValues`(`WorkForm.tsx:387, :579`)가 정규화 → Firestore 직렬화 안전.
- **이미지 순서 변경/삭제**: 캡션이 이미지 객체에 종속되어 자동으로 따라감 (설계 결정 2, 코드 검증됨).
- **신규 업로드 이미지**: Phase 3 미적용 시 캡션 소실 — **반드시 같이 처리**.
- **XSS**: plain text + React 이스케이프로 충분.
- **긴 텍스트**: `imageCaptionMaxLength`로 입력 제한 + 표시 영역 줄바꿈/말줄임 정책 결정 필요.

---

## 8. 디자인 확정 사항

1. **정렬**: 이미지 **아래 우측 정렬**(`text-align: right`)로 확정 (클라이언트 피드백). 오버레이/중앙 정렬 아님.
2. **다중 줄**: "한 줄" 강조됨 → 단일 라인 `Input`으로 진행. 추후 필요 시 확장.

---

## 9. 작업 순서 요약

```
타입·상수(P1) → admin 입력 UI(P2) → 🔴 저장 병합 수정(P3) → admin 검증(P4) → front 표시(P5) → 테스트(P6)
```

- **Mapper 변경 없음**, **`PendingImage` 변경 없음** (둘 다 검증 완료).
- **Front 표시는 두 곳**: ① `WorkDetailPage` 인라인(메인 상세) ② `ModalImage`(보조 모달). ①을 빠뜨리면 메인 진입 화면에 안 보임 — 실제로 겪은 버그.
- **깨지기 쉬운 지점**: ⒜ `WorkForm.tsx:283` 병합(신규 업로드 캡션 소실) ⒝ Front 렌더 경로가 둘로 갈림.
- front/admin `WorkImage` 타입이 분리돼 있으므로 **양쪽 모두** 필드 추가 필요.
