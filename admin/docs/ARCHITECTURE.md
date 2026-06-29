# admin 설계 구조

Vite + React 기반 관리자 대시보드. Firebase(Auth + Firestore + Storage)를 백엔드로 사용하며,
공개 포트폴리오 사이트(`front/`)의 데이터(작품·카테고리·설정)를 생성/수정/삭제한다.

> 이 문서는 `admin/src` 디렉토리를 실제로 확인하여 작성했다. 프로젝트 전체 개요는
> 루트 [`docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md)를 참고.

---

## 기술 스택

| 분류 | 사용 기술 |
|------|-----------|
| Build | Vite 7 |
| UI | React 19, Ant Design 5 (`antd`, `@ant-design/icons`) |
| Router | React Router 7 (`react-router-dom`) |
| 서버 상태 | TanStack Query v5 |
| 전역 상태 | Zustand 5 (인증 한정) |
| Rich Text | TipTap 3 (StarterKit, Link, TextStyle, Underline) |
| Backend | Firebase 12 (Auth / Firestore / Storage / Analytics) |
| 보안 | DOMPurify (HTML 새니타이즈) |
| 기타 | dayjs(날짜), uuid(ID) |
| Test | Vitest + Testing Library + jsdom |

### 스크립트

```bash
npm run dev            # 개발 서버 (port 5173)
npm run dev:emulator   # Firebase Emulator 연결
npm run emulators      # Emulator 시작 (데이터 유지)
npm run build          # tsc -b + vite build
npm run test           # Vitest (watch)
npm run test:coverage  # 커버리지
npm run deploy         # 빌드 + Firebase Hosting 배포
```

---

## 레이어 구조

Clean Architecture 4계층. 의존성은 항상 아래로만 흐른다.

```
┌──────────────────────────────────────────────┐
│  UI         pages/ · components/ · layouts/    │
├──────────────────────────────────────────────┤
│  Domain     domain/hooks/  (Custom Hook)       │
├──────────────────────────────────────────────┤
│  Data       data/api · data/repository ·       │
│             data/mappers                       │
├──────────────────────────────────────────────┤
│  Core       core/types · constants · utils ·   │
│             errors                             │
└──────────────────────────────────────────────┘
        전역 상태: state/ (Zustand, 인증 전용)
        진입점:    main.tsx · App.tsx · data/api/client.ts
```

> 참고: `front/`와 달리 admin에는 별도의 `presentation/` 디렉토리가 없다.
> UI 계층은 `src/pages`, `src/components`, `src/layouts`로 `src/` 직속에 위치한다.

### 실제 디렉토리 트리

```
admin/src/
├── main.tsx                # 진입점 (StrictMode + createRoot)
├── App.tsx                 # Provider 조립 + 라우팅 + 인증 초기화
│
├── core/                   # 의존성 없는 공통 계층
│   ├── constants/          # api.ts, config.ts (firebaseConfig, appConfig)
│   ├── types/              # api.ts(도메인 모델), common.ts(공통 타입)
│   ├── errors/             # CustomError.ts (에러 클래스 계층)
│   └── utils/              # date, string, validation, image,
│                           # imageUploadMerge, logger, errorMessages
│
├── data/                   # 데이터 접근 계층
│   ├── api/                # Firebase 직접 호출
│   │   ├── client.ts       # Firebase 초기화 + Emulator 연결 (단일 초기화 지점)
│   │   ├── worksApi.ts     analyticsApi.ts  backupApi.ts
│   │   ├── categoriesApi.ts settingsApi.ts  storageApi.ts
│   │   └── authApi.ts
│   ├── repository/         # API 래핑 + 캐시 키/설정 중앙 관리
│   │   ├── cacheKeys.ts    # cacheKeys + cacheConfig
│   │   ├── worksRepository.ts        storageRepository.ts
│   │   ├── categoriesRepository.ts   settingsRepository.ts
│   │   ├── authRepository.ts         analyticsRepository.ts
│   │   ├── backupRepository.ts
│   │   └── index.ts        # re-export (backup 제외)
│   └── mappers/            # Firestore 문서 ↔ 도메인 모델 변환
│       └── work / category / user / settings Mapper.ts
│
├── domain/
│   └── hooks/              # 비즈니스 로직 Custom Hook
│       ├── useAuth.ts      useWorks.ts      useCategories.ts
│       ├── useStorage.ts   useSettings.ts   useAnalytics.ts
│       └── useBackup.ts
│
├── pages/                  # 라우트 단위 페이지
│   ├── Login.tsx           Dashboard.tsx    WorksList.tsx
│   ├── WorkForm.tsx        Categories.tsx   Settings.tsx
│
├── components/             # 재사용 UI 컴포넌트
│   ├── CaptionEditor.tsx   # TipTap 리치 텍스트 에디터
│   ├── ImageUploader.tsx   VideoUploader.tsx
│   ├── MediaOrderManager.tsx  WorkOrderManager.tsx
│   ├── HomeIconManager.tsx    BackupManager.tsx
│
├── layouts/
│   └── MainLayout.tsx      # 헤더 + 사이드바(데스크탑)/Drawer(모바일) + Outlet
│
└── state/
    └── authStore.ts        # Zustand 인증 스토어
```

---

## Core — 공통 계층

의존성이 없는 최하위 계층. 타입·상수·에러·유틸을 모은다.

### 타입 (`core/types/api.ts`, `common.ts`)

주요 도메인 모델:

| 타입 | 핵심 필드 |
|------|-----------|
| `User` | id, email, role(`'admin' \| 'viewer'`), displayName, createdAt, lastLoginAt |
| `Work` | id, title, year, shortDescription, fullDescription, thumbnailImageId, `images[]`, `videos[]`, caption, `sentenceCategoryIds[]`, `exhibitionCategoryIds[]`, isPublished, viewCount, 타임스탬프 |
| `WorkImage` | id, url, thumbnailUrl, listThumbnailUrl, webpUrl, order, width, height, fileSize, caption(선택) |
| `WorkVideo` | id, youtubeUrl, youtubeVideoId, embedUrl, title, order |
| `SentenceCategory` | id, sentence, `keywords[]`, displayOrder, isActive |
| `ExhibitionCategory` | id, title, description{exhibitionType, venue, year}, displayOrder, `workOrders[]`, isActive |
| `PaginatedResult<T>` | items[], hasMore, lastCursor (커서 기반 페이지네이션) |

### 상수 (`core/constants/config.ts`)

- `firebaseConfig` — `VITE_*` 환경변수에서 로드, `isFirebaseConfigValid()`로 검증
- `appConfig` — 이미지 제한(최대 용량/허용 타입/썸네일·원본 사이즈), 텍스트 길이 제한(캡션 1000자, 이미지 캡션 200자 등), 페이지네이션 기본값

### 에러 (`core/errors/CustomError.ts`)

`AppError`를 기반으로 한 클래스 계층: `ValidationError`, `NetworkError`, `AuthError`,
`PermissionError`, `NotFoundError`, `UploadError`. `isAppError()` 등 타입 가드 제공.

### 유틸 (`core/utils/`)

`image.ts`(canvas 리사이징/검증), `validation.ts`, `string.ts`, `date.ts`,
`logger.ts`(`createLogger` 팩토리), `errorMessages.ts`,
`imageUploadMerge.ts`(신규 업로드 이미지와 기존 이미지 병합).

---

## Data — 데이터 접근 계층

### API (`data/api/`)

Firebase SDK를 직접 호출하는 가장 낮은 데이터 레이어.

- **client.ts** — Firebase 앱/서비스(`auth`, `db`, `storage`) 초기화. `import.meta.env.DEV`이고
  `VITE_USE_FIREBASE_EMULATOR === 'true'`이면 Auth(9099)/Firestore(8080)/Storage(9199) Emulator에 연결.
  대부분의 API 모듈이 이 파일에서 인스턴스를 import.
- **worksApi.ts** — `works` 컬렉션 CRUD, 전체 조회(`createdAt desc`), 커서 기반 페이지네이션, 조회수 증가, 유효성 검사.
- **categoriesApi.ts** — 문장형/전시명 카테고리 CRUD.
- **storageApi.ts** — Storage 파일 업로드(진행률 콜백)/삭제.
- **authApi.ts** — Google OAuth 로그인, Emulator 로그인(DEV), 로그아웃, `onAuthStateChanged` 구독.
- **settingsApi.ts / analyticsApi.ts / backupApi.ts** — 사이트 설정 / 통계 / 백업·복구.

### Repository (`data/repository/`)

API를 래핑하고 캐시 키·설정을 함께 관리하는 계층. Domain Hook은 항상 `data/repository`의
`index.ts`를 통해 접근한다.

- 이미지 업로드/삭제 함수(`uploadImage`, `uploadImages`, `deleteImage`, `deleteWorkImages`)는
  전용 **`storageRepository.ts`** 에 분리되어 있다.
- GA4 통계는 **`analyticsRepository.ts`** 가 `analyticsApi`를 래핑하며, 캐시 키도 `cacheKeys.analytics`로 관리한다.
- `repository/index.ts`는 works/storage/categories/settings/auth/analytics + cacheKeys를 re-export한다.
  `backupRepository`는 여기서 export되지 않고 `BackupManager` 등에서 직접 import한다.

### Mapper (`data/mappers/`)

Firestore 문서와 도메인 모델 간 변환. Firestore `Timestamp → Date` 변환, 저장 시 `undefined`
필드 제거(선택 값 처리) 담당. `workMapper`, `categoryMapper`, `userMapper`, `settingsMapper`.

### 캐시 키 전략 (`data/repository/cacheKeys.ts`)

계층적 키 구조로 부분 무효화가 가능하다.

```ts
cacheKeys.works.all          // ['works']
cacheKeys.works.lists()      // ['works', 'list']
cacheKeys.works.list(filters)// ['works', 'list', filters]
cacheKeys.works.detail(id)   // ['works', 'detail', id]
cacheKeys.works.published()  // ['works', 'published']
// categories.sentence / categories.exhibition / settings.site / auth.user 동일 패턴
```

`cacheConfig`로 데이터 성격별 캐시 정책을 분리한다.

| 정책 | staleTime | gcTime | 대상 |
|------|-----------|--------|------|
| `static` | 5분 | 30분 | 카테고리, 설정 |
| `dynamic` | 1분 | 10분 | 작품 |
| `realtime` | 0 | 5분 | 인증 |

---

## Domain — 비즈니스 로직 (Custom Hooks)

`domain/hooks/`. 조회는 `useQuery`, 변경은 `useMutation` + `invalidateQueries`로 캐시를 무효화한다.

| 파일 | 주요 Hook |
|------|-----------|
| `useAuth.ts` | `useAuth`, `useCurrentUser`, `useSetUserRole`, `useRequireAuth`, `useRequireAdmin` |
| `useWorks.ts` | `useWorks`, `usePaginatedWorks`, `useWork`, `usePublishedWorks`, `useCreateWork`, `useUpdateWork`, `useDeleteWork`, `useToggleWorkPublish` |
| `useCategories.ts` | `useSentenceCategories`, `useActiveSentenceCategories`, `useExhibitionCategories`, 각 CRUD, `useUpdateCategoryOrders` |
| `useStorage.ts` | `useUploadImage`, `useUploadImages`, `useDeleteImage`, `useImageManager`(상태 + 추가/삭제/순서 변경 통합) |
| `useSettings.ts` | `useSiteSettings`, `useUpdateSiteSettings`, favicon/제목/푸터 관련 |
| `useAnalytics.ts` | `useDailyVisitors`, `usePageStats`, `useRealtimeUsers` |
| `useBackup.ts` | `useCreateBackup`, `useRestoreBackup` |

> `useAnalytics`도 다른 도메인과 동일하게 `analyticsRepository`를 거치며, 캐시 키는 `cacheKeys.analytics`를 사용한다.

### Mutation 패턴

```ts
export function useUpdateWork() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => updateWork(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cacheKeys.works.all });
    },
  });
}
```

---

## UI — pages / components / layouts

### 라우팅 & Provider 조립 (`App.tsx`)

Provider는 바깥에서 안으로 `QueryClientProvider → ConfigProvider(koKR) → AntdApp →
BrowserRouter → AuthInitializer` 순으로 감싼다.

- `AuthInitializer` — 마운트 시 `useAuthStore().initializeAuth()` 호출로 인증 상태 복원.
- `ProtectedRoute` — `isLoading`이면 스피너, 미인증이면 `/login`으로 리다이렉트.
- `QueryClient` 기본값: `staleTime` 5분, `refetchOnWindowFocus: false`.

| 경로 | 컴포넌트 | 보호 |
|------|----------|------|
| `/login` | `Login` | 공개 |
| `/` | → `/dashboard` 리다이렉트 | 보호 |
| `/dashboard` | `Dashboard` | 보호 |
| `/works` | `WorksList` | 보호 |
| `/works/new`, `/works/:id` | `WorkForm` (생성/수정 공용) | 보호 |
| `/categories` | `Categories` | 보호 |
| `/settings` | `Settings` | 보호 |

보호 라우트는 모두 `MainLayout`(헤더 + 데스크탑 사이드바/모바일 Drawer + `<Outlet />`) 하위에 중첩된다.

### 페이지

- **Login** — Google OAuth, DEV용 Emulator 로그인 옵션.
- **Dashboard** — 작품 통계 카드, 최근 작품, 방문 통계.
- **WorksList** — 상태/카테고리/검색 필터(디바운스 500ms), 배치 삭제, 모바일 List/데스크탑 Table 분기.
  **필터 없음 → 커서 페이지네이션, 필터 있음 → 전체 조회 후 클라이언트 필터**로 분기.
- **WorkForm** — 가장 복잡. 이미지 업로드·비디오·미디어 순서·썸네일 선택·캡션 에디터·카테고리 다중 선택,
  변경 추적 + 저장 확인 모달, `mergeUploadedImages`로 선택적 업로드 병합.
- **Categories** — 문장형(키워드별 작품 순서) / 전시명(전시 정보 + 작품 순서) 카테고리 CRUD 및 `displayOrder` 조정.
- **Settings** — favicon / 브라우저 제목 / 푸터 텍스트 + 백업 관리.

### 주요 컴포넌트

| 컴포넌트 | 역할 |
|----------|------|
| `CaptionEditor` | TipTap 에디터. Bold/Italic/Underline + 작업 링크 삽입(검색 모달). 글자 수 제한, DOMPurify 새니타이즈 |
| `ImageUploader` | 드래그앤드롭/클릭 업로드, 진행률, 썸네일, 용량·타입 검증, 이미지 메타데이터 |
| `VideoUploader` | YouTube URL → videoId/embedUrl 추출 |
| `MediaOrderManager` | 이미지/영상 순서 조정 |
| `WorkOrderManager` | 카테고리(키워드·전시)별 작품 순서 관리 |
| `BackupManager` | 백업 생성/다운로드/복구 |

### CaptionEditor — TipTap 사용 패턴

```ts
const editor = useEditor({
  extensions: [
    StarterKit.configure({ heading: false, blockquote: false, codeBlock: false }),
    CustomLink.configure({ openOnClick: false }), // data-work-id 등 커스텀 속성 추가
    Underline,
  ],
  content: value,
  onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
});
```

작업 링크에는 `data-work-id`, `data-work-title` 메타데이터를 담아 front 사이트에서 내부 링크로 활용한다.
저장 전 HTML은 DOMPurify로 새니타이즈한다.

---

## 전역 상태 — `state/authStore.ts` (Zustand)

서버 상태는 TanStack Query가, UI 상태는 로컬 컴포넌트 state가 담당하므로 Zustand는 **인증에만** 사용한다.

```ts
const useAuthStore = create<AuthStore>((set) => ({
  user, isAuthenticated, isLoading, error,        // 상태
  login, loginEmulator, logout,                   // 액션
  initializeAuth, clearError,
}));
// 셀렉터: selectUser / selectIsAuthenticated / selectIsAdmin / selectError
```

`App.tsx`의 `AuthInitializer`가 앱 시작 시 `initializeAuth()`를 호출해 `onAuthStateChanged` 구독을 건다.

---

## 데이터 흐름

```
컴포넌트 (pages/ · components/)
   │ Hook 호출
   ▼
Custom Hook (domain/hooks)        ── useQuery / useMutation
   │ repository 함수 호출
   ▼
Repository (data/repository)      ── 캐시 키 + 정책 부여
   │ API 호출
   ▼
Firebase API (data/api)           ── Firestore / Storage / Auth
   │
   ▼
Mapper (data/mappers)             ── Firestore 문서 ↔ 도메인 모델
   │
   ▼
TanStack Query 캐시 → UI 갱신
```

---

## 기능 도메인 한눈에 보기

| 도메인 | Firestore | API → Repository → Hook → Page |
|--------|-----------|--------------------------------|
| Works | `works` | worksApi → worksRepository → `useWorks` 등 → WorksList / WorkForm |
| Categories | `sentenceCategories`, `exhibitionCategories` | categoriesApi → categoriesRepository → `useSentenceCategories` 등 → Categories |
| Auth | `users` (role 기반) | authApi → authRepository → `useAuth` 등 → Login |
| Storage | (Storage 파일) | storageApi → storageRepository → `useUploadImage` 등 → WorkForm |
| Settings | `settings` | settingsApi → settingsRepository → `useSiteSettings` 등 → Settings |
| Backup | 전체 데이터 | backupApi → backupRepository → `useBackup` → Settings |
| Analytics | 통계 | analyticsApi → analyticsRepository → `useDailyVisitors` 등 → Dashboard |

---

## 개발 환경 (Firebase Emulator)

```bash
# 터미널 1
npm run emulators       # Emulator 시작 (emulator-data로 상태 유지)
# 터미널 2
npm run dev:emulator    # VITE_USE_FIREBASE_EMULATOR=true 로 앱 실행
```

`data/api/client.ts`가 DEV + 플래그를 감지해 Auth/Firestore/Storage Emulator에 자동 연결한다.

---

## 비고

- **Firebase 초기화는 `data/api/client.ts` 단일 지점**으로 통합되어 있다(Emulator 연결 포함).
  과거 존재하던 `config/firebase.ts` 중복 초기화는 제거되었다.
- `backupRepository`는 `repository/index.ts`에서 re-export하지 않고 `BackupManager`에서 직접 import한다.
  (백업/복원은 다른 도메인과 라이프사이클이 달라 의도적으로 분리된 상태)

---

**마지막 업데이트**: 2026-06-30
