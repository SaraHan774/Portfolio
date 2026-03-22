# ARCHITECTURE.md: 프로젝트 구조 및 설계

## 프로젝트 구성

두 개의 독립적인 앱 + Firebase 백엔드로 구성된 모노레포.

```
Portfolio/
├── front/          # Next.js 16 — 공개 포트폴리오 사이트
├── admin/          # Vite + React — 관리자 대시보드
├── functions/      # Firebase Cloud Functions
├── firestore.rules # Firestore 보안 규칙
├── storage.rules   # Storage 보안 규칙
└── firebase.json   # Firebase 프로젝트 설정
```

---

## front/ — 포트폴리오 사이트

**스택**: Next.js 16, React 19, TanStack Query v5, Tailwind v4, Framer Motion, Firebase (읽기 전용)

### 폴더 구조

```
front/src/
├── core/
│   ├── constants/      # routes, colors, firebase, ui, animation, debug
│   ├── errors/         # AppError
│   ├── types/          # Work, Category, SiteSettings, User
│   └── utils/          # formatDate, media, thumbnails, youtube
├── data/
│   ├── api/
│   │   ├── client.ts   # Firebase 초기화 (Auth 없음, 읽기 전용)
│   │   ├── worksApi.ts
│   │   ├── categoriesApi.ts
│   │   ├── settingsApi.ts
│   │   └── analytics.ts
│   ├── cache/
│   │   └── queryKeys.ts  # TanStack Query 키 중앙 관리
│   ├── mappers/          # workMapper, categoryMapper, settingsMapper
│   └── repository/       # WorkRepository, CategoryRepository, SettingsRepository
├── domain/
│   └── hooks/            # 비즈니스 로직 Hook (아래 목록 참조)
├── presentation/
│   ├── components/       # work/, category/, media/, mobile/, layout/
│   └── ui/               # animation/, common/, layout/, media/
└── state/
    ├── contexts/         # CategorySelectionContext, WorkSelectionContext,
    │                     # UIStateContext, CategoriesContext
    └── providers/        # QueryProvider
```

### 주요 Domain Hooks

| Hook | 역할 |
|------|------|
| `useWorks` | 작품 목록 조회 (React Query) |
| `useCategories` | 카테고리 조회 |
| `useSiteSettings` | 사이트 설정 조회 |
| `useFilteredWorks` | 카테고리 필터링된 작품 목록 |
| `useWorkSelection` | 작품 선택/모달 상태 |
| `useCategorySelection` | 카테고리 선택 상태 |
| `useModalLinkHandler` | 모달 내 링크 처리 |
| `useImageTracker` | 이미지 로드 추적 |
| `usePinchZoom` | 터치 핀치 줌 |
| `useSwipeGesture` | 스와이프 제스처 |
| `useMobileDetection` | 모바일 감지 |

### 상태 관리 (front)

- **서버 상태**: TanStack Query (`useWorks`, `useCategories` 등)
- **UI 상태**: React Context (`UIStateContext`, `WorkSelectionContext` 등)
- **인증**: 없음 (공개 사이트)

---

## admin/ — 관리자 대시보드

**스택**: Vite 7, React 19, React Router 7, Zustand 5, TanStack Query v5, Ant Design 5, TipTap 3, Firebase (읽기+쓰기+Auth)

### 폴더 구조

```
admin/src/
├── core/
│   ├── constants/    # api.ts, config.ts (Firebase, 이미지/텍스트/페이징 설정)
│   ├── types/        # api.ts, common.ts
│   ├── errors/       # CustomError
│   └── utils/        # date, string, validation, image, logger, errorMessages
├── config/
│   └── firebase.ts   # Firebase 초기화 (Auth + Firestore + Storage + Analytics)
├── data/
│   ├── api/          # authApi, worksApi, categoriesApi, settingsApi,
│   │                 # storageApi, analyticsApi, backupApi
│   ├── mappers/      # userMapper, workMapper, categoryMapper, settingsMapper
│   └── repository/   # auth, works, categories, settings, backup, cacheKeys
├── domain/
│   └── hooks/        # 비즈니스 로직 Hook (아래 목록 참조)
├── state/
│   └── authStore.ts  # Zustand 인증 스토어
├── pages/            # Login, Dashboard, WorksList, WorkForm, Categories, Settings
├── layouts/          # MainLayout
└── components/       # CaptionEditor, ImageUploader, VideoUploader,
                      # MediaOrderManager, WorkOrderManager, BackupManager
```

### 주요 Domain Hooks

| 분류 | Hook |
|------|------|
| **Auth** | `useAuth`, `useCurrentUser`, `useIsAdmin`, `useRequireAdmin` |
| **Works** | `useWorks`, `usePaginatedWorks`, `useWork`, `useCreateWork`, `useUpdateWork`, `useDeleteWork`, `useToggleWorkPublish` |
| **Categories** | `useSentenceCategories`, `useExhibitionCategories`, `useUpdateCategoryOrders`, `useToggleCategoryActive` |
| **Settings** | `useSiteSettings`, `useUpdateSiteSettings`, `useUploadFavicon` |
| **Storage** | `useUploadImage`, `useUploadImages`, `useDeleteImage`, `useImageManager` |
| **Backup** | `useCreateBackup`, `useRestoreBackup` |
| **Analytics** | `useDailyVisitors`, `usePageStats`, `useRealtimeUsers` |

### 상태 관리 (admin)

- **인증 상태**: Zustand (`authStore.ts`) — `useAuth`, `useIsAdmin`, `useCurrentUser` 셀렉터 제공
- **서버 상태**: TanStack Query
- **UI 상태**: 로컬 컴포넌트 상태

---

## 공통 아키텍처 원칙

### Clean Architecture 레이어

```
┌─────────────────────────────────────┐
│     Presentation (컴포넌트, 페이지) │
├─────────────────────────────────────┤
│     Domain (Custom Hooks)           │
├─────────────────────────────────────┤
│     Data (Repository, API, Mapper)  │
├─────────────────────────────────────┤
│     Core (타입, 상수, 유틸)         │
└─────────────────────────────────────┘
```

의존성은 아래로만 향함. `Presentation → Domain → Data → Core`.

### Firebase 데이터 흐름

```
컴포넌트
  ↓ (Hook 호출)
Custom Hook (domain/hooks)
  ↓ (Repository 호출)
Repository (data/repository)
  ↓ (API 함수 호출)
Firebase API (data/api)
  ↓
Firestore / Storage / Auth
  ↓
Mapper → Domain 모델 → TanStack Query 캐시 → UI 업데이트
```

### Repository 패턴 (실제 예시)

```typescript
// data/repository/WorkRepository.ts
export const workRepository = {
  async getAll(): Promise<Work[]> {
    const snapshot = await getDocs(collection(db, 'works'));
    return snapshot.docs.map(workMapper.fromFirestore);
  },

  async update(id: string, payload: Partial<Work>): Promise<void> {
    await updateDoc(doc(db, 'works', id), workMapper.toFirestore(payload));
  },
};
```

### Custom Hook 패턴 (실제 예시)

```typescript
// domain/hooks/useWorks.ts
export function useWorks() {
  return useQuery({
    queryKey: queryKeys.works.all,
    queryFn: () => workRepository.getAll(),
    staleTime: 5 * 60 * 1000,
  });
}

// domain/hooks/useUpdateWork.ts (admin)
export function useUpdateWork() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Work> }) =>
      workRepository.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.works.all });
    },
  });
}
```

### 컴포넌트 원칙

```typescript
// ✅ Props만 받음, 비즈니스 로직 없음
interface WorkCardProps {
  work: Work;
  onSelect: (id: string) => void;
}
const WorkCard = React.memo(({ work, onSelect }: WorkCardProps) => (
  <div onClick={() => onSelect(work.id)}>
    <img src={work.thumbnailUrl} alt={work.title} />
  </div>
));

// ✅ 로직은 Hook에서
function WorkListPage() {
  const { data: works, isLoading } = useFilteredWorks();
  const { selectWork } = useWorkSelection();
  // ...
}
```

## 순환 의존성 금지

```
❌ data/ → domain/ → data/
✅ presentation/ → domain/ → data/ → core/
```

---

**더 보기**: `docs/NETWORK.md`, `docs/TESTING.md`
