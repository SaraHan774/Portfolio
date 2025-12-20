# Architecture Comparison: Current vs. Target

## Current Architecture (❌ Problematic)

```
┌─────────────────────────────────────────────────────────────┐
│                     App Router (Next.js)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  page.tsx    │  │ layout.tsx   │  │ works/[id]/  │     │
│  │              │  │              │  │  page.tsx    │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    UI Components                            │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Sidebar    │  │  WorkGrid    │  │  Floating    │      │
│  │  (545 LOC)  │  │              │  │  Window      │      │
│  │  • Layout   │  │  • Filtering │  │  • Position  │      │
│  │  • Scroll   │  │  • Display   │  │  • Fetching  │◄─┐   │
│  │  • State    │  │              │  │              │  │   │
│  └─────────────┘  └──────────────┘  └──────────────┘  │   │
└───────────────────────────────────────────────────────┼───┘
                                                        │
                    ⚠️ DIRECT CALLS ⚠️                 │
                                                        │
┌───────────────────────────────────────────────────────┼───┐
│                 lib/services/                         │   │
│  ┌────────────────────────────────────────────────┐  │   │
│  │  worksService.ts                               │  │   │
│  │  • getPublishedWorks()                         │◄─┘   │
│  │  • getWorkById()                               │      │
│  │  • Firestore queries                           │      │
│  │  • Data transformation                         │      │
│  └────────────────┬───────────────────────────────┘      │
└───────────────────┼──────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    Firebase/Firestore                       │
└─────────────────────────────────────────────────────────────┘

Problems:
❌ No separation of concerns
❌ UI components do data fetching
❌ Business logic mixed with presentation
❌ No caching strategy
❌ Hard to test
❌ Hard to maintain
```

## Target Architecture (✅ Clean Architecture)

```
┌─────────────────────────────────────────────────────────────────┐
│                   PRESENTATION LAYER                            │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  App Router (Next.js)                                   │    │
│  │  pages/ - Server Components for routing                │    │
│  └────────────────────┬───────────────────────────────────┘    │
│                       │                                         │
│  ┌────────────────────▼───────────────────────────────────┐    │
│  │  Smart Components (Container Components)               │    │
│  │  • SidebarContainer                                    │    │
│  │  • WorkGridContainer                                   │    │
│  │  • Connect hooks to UI                                 │    │
│  └────────────────────┬───────────────────────────────────┘    │
│                       │                                         │
│  ┌────────────────────▼───────────────────────────────────┐    │
│  │  Presentational Components (Pure UI)                   │    │
│  │  • Sidebar (simplified)                                │    │
│  │  • WorkTitleButton                                     │    │
│  │  • WorkListScroller                                    │    │
│  │  • AnimatedKeyword                                     │    │
│  │  Props in → JSX out                                    │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                       │
                       │ Uses Hooks
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DOMAIN LAYER                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Custom Hooks (Business Logic)                           │  │
│  │  ┌─────────────────────────────────────────────────┐    │  │
│  │  │  Data Hooks                                      │    │  │
│  │  │  • usePublishedWorks()                           │    │  │
│  │  │  • useWork(id)                                   │    │  │
│  │  │  • useSentenceCategories()                       │    │  │
│  │  │  • useExhibitionCategories()                     │    │  │
│  │  └─────────────────────────────────────────────────┘    │  │
│  │  ┌─────────────────────────────────────────────────┐    │  │
│  │  │  Business Logic Hooks                            │    │  │
│  │  │  • useWorkSelection()                            │    │  │
│  │  │  • useCategorySelection()                        │    │  │
│  │  │  • useWorkFiltering()                            │    │  │
│  │  │  • useThumbnailUrl()                             │    │  │
│  │  │  • useFloatingPosition()                         │    │  │
│  │  │  • useWorkListScroll()                           │    │  │
│  │  └─────────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                       │
                       │ Uses Repositories
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  React Query (Caching & State Management)               │  │
│  │  • Query keys                                            │  │
│  │  • Cache invalidation                                    │  │
│  │  • Optimistic updates                                    │  │
│  │  • Stale time / Cache time                              │  │
│  └──────────────────────┬───────────────────────────────────┘  │
│                         │                                       │
│  ┌──────────────────────▼───────────────────────────────────┐  │
│  │  Repositories (Data Access Abstraction)                  │  │
│  │  • WorkRepository                                        │  │
│  │  • CategoryRepository                                    │  │
│  │  • SettingsRepository                                    │  │
│  │  Interface to data sources                              │  │
│  └──────────────────────┬───────────────────────────────────┘  │
│                         │                                       │
│  ┌──────────────────────▼───────────────────────────────────┐  │
│  │  API Clients (HTTP/Firestore Calls)                      │  │
│  │  • worksApi.ts                                           │  │
│  │  │  - getPublishedWorks()                               │  │
│  │  │  - getWorkById()                                     │  │
│  │  │  - Firestore queries                                 │  │
│  │  • categoriesApi.ts                                     │  │
│  │  • settingsApi.ts                                       │  │
│  └──────────────────────┬───────────────────────────────────┘  │
└────────────────────────┼────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  External Services                              │
│                  Firebase/Firestore                             │
└─────────────────────────────────────────────────────────────────┘
         ▲
         │
┌────────┴────────────────────────────────────────────────────────┐
│                     CORE LAYER                                  │
│  • Types (work.types.ts, category.types.ts)                    │
│  • Constants (firebase.constants.ts, ui.constants.ts)          │
│  • Errors (custom error classes)                               │
│  • Utils (thumbnail.utils.ts, format.utils.ts)                 │
└─────────────────────────────────────────────────────────────────┘

Benefits:
✅ Clear separation of concerns
✅ UI components are pure and testable
✅ Business logic isolated in hooks
✅ Data layer provides caching
✅ Easy to test each layer
✅ Easy to swap implementations
✅ Follows SOLID principles
```

## Data Flow Comparison

### Current Flow (Problematic)

```
User Click
    │
    ▼
Component (Sidebar)
    │
    ├─► setState (local)
    │
    ▼
Component (FloatingWorkWindow)
    │
    ├─► useEffect
    │
    ▼
Direct Firestore Call
    │
    ├─► getWorkById(id)
    │
    ▼
Firestore
    │
    ▼
Data returned
    │
    ├─► setState
    │
    ▼
Re-render

Issues:
❌ No caching - same work fetched multiple times
❌ Loading states managed manually
❌ Error handling scattered
❌ Hard to test
```

### Target Flow (Clean)

```
User Click
    │
    ▼
Smart Component
    │
    ├─► Calls hook: useWorkSelection()
    │
    ▼
Custom Hook (Business Logic)
    │
    ├─► Derives selection state
    ├─► Calls: useWork(selectedId)
    │
    ▼
Data Hook
    │
    ├─► Uses React Query
    │
    ▼
React Query
    │
    ├─► Check cache
    │   • Hit: Return cached data ✅
    │   • Miss: Fetch data
    │
    ▼
Repository
    │
    ├─► workRepository.getWorkById(id)
    │
    ▼
API Client
    │
    ├─► Firestore query
    │
    ▼
Firestore
    │
    ▼
Data returned
    │
    ├─► Repository transforms
    ├─► React Query caches
    │
    ▼
Hook returns { data, isLoading, error }
    │
    ▼
Smart Component
    │
    ├─► Passes to presentational component
    │
    ▼
Presentational Component renders

Benefits:
✅ Automatic caching
✅ Loading/error states handled
✅ Easy to test each layer
✅ Reusable hooks
✅ Optimistic updates possible
```

## Component Hierarchy Comparison

### Current (Flat & Coupled)

```
page.tsx
  └─► Sidebar (545 LOC)
       ├─► SentenceCategory (247 LOC)
       │    └─► Complex animation logic
       │    └─► State derivation
       │    └─► Inline rendering
       │
       ├─► TextCategory (similar complexity)
       │
       └─► Inline WorkListScroller
            └─► Inline WorkTitleButton
                 └─► Thumbnail logic
                 └─► State management

Problems:
❌ Too much responsibility per component
❌ Hard to test in isolation
❌ Hard to reuse
❌ Performance issues (large components re-render)
```

### Target (Hierarchical & Modular)

```
page.tsx (Server Component)
  └─► SidebarContainer (Smart Component)
       ├─► Uses hooks:
       │    ├─► useSentenceCategories()
       │    ├─► useExhibitionCategories()
       │    ├─► useCategorySelection()
       │    └─► useWorksByCategory()
       │
       └─► Renders:
            ├─► Sidebar (Presentational)
            │    ├─► SentenceCategoryList
            │    │    └─► SentenceCategory (Simplified)
            │    │         └─► AnimatedKeyword
            │    │
            │    ├─► ExhibitionCategoryList
            │    │    └─► ExhibitionCategory
            │    │
            │    └─► WorkListScroller
            │         └─► WorkTitleButton
            │              └─► WorkThumbnail

Benefits:
✅ Small, focused components
✅ Easy to test
✅ Easy to reuse
✅ Better performance (memoization possible)
✅ Clear responsibility
```

## State Management Comparison

### Current (Scattered)

```
Sidebar.tsx
  ├─► const [hoveredKeywordId, setHoveredKeywordId] = useState()
  ├─► const [hoveredExhibitionCategoryId, setHoveredExhibitionCategoryId] = useState()
  └─► Passed via props (prop drilling)

FloatingWorkWindow.tsx
  ├─► const [work, setWork] = useState()
  ├─► const [position, setPosition] = useState()
  └─► useEffect for fetching

SentenceCategory.tsx
  ├─► Derives state in render
  └─► Complex state calculations

Problems:
❌ State duplicated across components
❌ Prop drilling
❌ Hard to debug
❌ No single source of truth
```

### Target (Centralized)

```
React Query (Server State)
  ├─► Works cache
  ├─► Categories cache
  └─► Settings cache

Context/Zustand (Client/UI State)
  ├─► CategorySelectionContext
  │    ├─► selectedKeywordId
  │    ├─► selectedExhibitionCategoryId
  │    └─► hoveredIds
  │
  ├─► WorkSelectionContext
  │    ├─► selectedWorkId
  │    └─► filteredWorkIds
  │
  └─► UIStateContext
       ├─► floatingWindowVisible
       └─► floatingWindowPosition

Custom Hooks (Derived State)
  ├─► useWorkSelection()
  ├─► useCategorySelection()
  └─► useKeywordState()

Benefits:
✅ Single source of truth
✅ No prop drilling
✅ Easy to debug (React DevTools)
✅ Server state separated from UI state
✅ Automatic synchronization
```

## Testing Comparison

### Current (Hard to Test)

```typescript
// Difficult to test Sidebar.tsx
// - Too many responsibilities
// - Direct Firestore dependency
// - Complex inline logic
// - Hard to mock

test('Sidebar renders categories', () => {
  // Need to mock:
  // - Firestore
  // - Multiple state variables
  // - Complex props
  // - Animation libraries

  // Component is too large to test effectively
});
```

### Target (Easy to Test)

```typescript
// Test Data Layer
describe('WorkRepository', () => {
  it('should fetch published works', async () => {
    const works = await workRepository.getPublishedWorks();
    expect(works).toBeDefined();
  });
});

// Test Domain Layer
describe('useWorkSelection', () => {
  it('should return selected work', () => {
    const { result } = renderHook(() => useWorkSelection());
    act(() => result.current.selectWork('work-1'));
    expect(result.current.selectedWork?.id).toBe('work-1');
  });
});

// Test Presentation Layer
describe('WorkTitleButton', () => {
  it('should render work title', () => {
    const work = mockWork();
    render(<WorkTitleButton work={work} onClick={jest.fn()} />);
    expect(screen.getByText(work.title)).toBeInTheDocument();
  });
});

Benefits:
✅ Each layer tested independently
✅ Easy to mock dependencies
✅ Fast unit tests
✅ High test coverage
✅ Confidence in refactoring
```

---

## Migration Strategy

The migration will be **incremental and safe**:

1. **Add new architecture alongside old** (no breaking changes)
2. **Migrate one component at a time**
3. **Run old and new in parallel** (feature flags if needed)
4. **Test thoroughly** before removing old code
5. **Rollback easy** (git worktree isolation)

This ensures the UI remains functional throughout the refactoring process.
