# Front Package Refactoring Plan

**Created**: 2025-12-20
**Branch**: `refactor/front`
**Status**: Planning

## Executive Summary

The front package requires careful refactoring to align with the clean architecture principles outlined in `CLAUDE.md`. The current codebase has complex UI logic tightly coupled with data fetching, no proper separation of concerns, and lacks the domain/data layers specified in the project guidelines.

## Current Architecture Analysis

### Existing Structure
```
front/
├── app/                    # Next.js App Router
│   ├── components/         # UI Components (❌ Mixed responsibilities)
│   │   ├── category/       # Category display components
│   │   ├── layout/         # Layout components (Sidebar, Header, Footer)
│   │   └── work/          # Work display components
│   ├── works/[id]/        # Dynamic work detail page
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── firebase.ts        # Firebase initialization
│   └── services/          # ❌ Direct Firestore services (should be in data layer)
└── types/
    └── index.ts           # Shared types
```

### Key Problems Identified

#### 1. **Architecture Violations**
- ❌ No proper layering (Core → Data → Domain → Presentation)
- ❌ Services directly called from UI components
- ❌ No Repository pattern
- ❌ No Custom Hooks for business logic
- ❌ Missing state management layer

#### 2. **Component Complexity** (High Risk Area ⚠️)
- `Sidebar.tsx` (545 lines): Too many responsibilities
  - Category rendering
  - Work list scrolling logic
  - State management for hover/selection
  - Complex layout calculations
  - Inline WorkTitleButton and WorkListScroller components

- `SentenceCategory.tsx` (247 lines): Complex animation logic
  - Character-by-character animation
  - State derivation for keyword states
  - Complex styling logic
  - Sentence parsing and rendering

- `FloatingWorkWindow.tsx` (190 lines): Complex positioning
  - Dynamic position calculation
  - Boundary detection
  - Data fetching inside component

#### 3. **Data Fetching Issues**
- Direct Firestore calls in UI components (`FloatingWorkWindow`)
- No caching strategy
- No loading/error states management
- Repeated data transformations

#### 4. **Code Quality Issues**
- Inline styles everywhere (no CSS modules)
- Complex state derivation in render functions
- Repeated logic (thumbnail URL calculation)
- No error boundaries
- No proper TypeScript strictness

#### 5. **Performance Issues**
- No memoization for expensive computations
- No React Query or SWR for data caching
- Component re-renders not optimized
- Large components causing unnecessary re-renders

## Refactoring Strategy

### Phase 1: Foundation Layer Setup (Low Risk)
**Goal**: Establish proper folder structure and move existing code without changing logic

#### 1.1 Create Folder Structure
```
front/src/
├── core/              # Constants, types, errors, utils
│   ├── constants/
│   ├── types/
│   ├── errors/
│   └── utils/
├── data/              # API clients, repositories, cache
│   ├── api/
│   ├── repositories/
│   └── cache/
├── domain/            # Business logic, custom hooks
│   ├── hooks/
│   └── services/
├── presentation/      # UI components, pages
│   ├── components/
│   ├── pages/
│   └── styles/
└── state/             # Global state management
    ├── contexts/
    └── stores/
```

#### 1.2 Move Types to Core Layer
- Move `types/index.ts` → `core/types/`
- Split into domain-specific files:
  - `work.types.ts`
  - `category.types.ts`
  - `settings.types.ts`
  - `ui.types.ts`

#### 1.3 Extract Constants
- Create `core/constants/`
  - `firebase.constants.ts` (collection names)
  - `ui.constants.ts` (animation durations, sizes)
  - `routes.constants.ts` (route paths)

### Phase 2: Data Layer (Medium Risk)
**Goal**: Create proper data abstraction with repositories

#### 2.1 Create API Clients
Move `lib/services/*` → `data/api/`
- `worksApi.ts`
- `categoriesApi.ts`
- `settingsApi.ts`

#### 2.2 Implement Repository Pattern
Create `data/repositories/`
- `WorkRepository.ts`
  - `getPublishedWorks()`
  - `getWorkById(id)`
  - `getWorksByKeywordId(keywordId)`
  - `getWorksByExhibitionCategoryId(categoryId)`

- `CategoryRepository.ts`
  - `getSentenceCategories()`
  - `getExhibitionCategories()`
  - `getKeywordById(keywordId)`

- `SettingsRepository.ts`
  - `getSiteSettings()`

#### 2.3 Add Caching Layer (React Query)
```bash
npm install @tanstack/react-query
```

Create `data/cache/queryKeys.ts`:
```typescript
export const queryKeys = {
  works: {
    all: ['works'] as const,
    published: () => [...queryKeys.works.all, 'published'] as const,
    detail: (id: string) => [...queryKeys.works.all, id] as const,
    byKeyword: (keywordId: string) => [...queryKeys.works.all, 'keyword', keywordId] as const,
    byExhibition: (categoryId: string) => [...queryKeys.works.all, 'exhibition', categoryId] as const,
  },
  categories: {
    all: ['categories'] as const,
    sentence: () => [...queryKeys.categories.all, 'sentence'] as const,
    exhibition: () => [...queryKeys.categories.all, 'exhibition'] as const,
  },
  settings: ['settings'] as const,
};
```

### Phase 3: Domain Layer (Medium Risk)
**Goal**: Extract business logic into custom hooks

#### 3.1 Create Custom Hooks
Create `domain/hooks/`

- `useWorks.ts`
  ```typescript
  export const usePublishedWorks = () => {
    return useQuery({
      queryKey: queryKeys.works.published(),
      queryFn: () => workRepository.getPublishedWorks(),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  export const useWork = (id: string) => {
    return useQuery({
      queryKey: queryKeys.works.detail(id),
      queryFn: () => workRepository.getWorkById(id),
      enabled: !!id,
    });
  };
  ```

- `useCategories.ts`
  ```typescript
  export const useSentenceCategories = () => { ... }
  export const useExhibitionCategories = () => { ... }
  ```

- `useSiteSettings.ts`
  ```typescript
  export const useSiteSettings = () => { ... }
  ```

#### 3.2 Extract Business Logic Hooks
- `useWorkSelection.ts` - Work selection state management
- `useCategorySelection.ts` - Category selection logic
- `useWorkFiltering.ts` - Work filtering by category
- `useThumbnailUrl.ts` - Thumbnail URL calculation logic

### Phase 4: Component Refactoring (⚠️ HIGH RISK - Complex UI)
**Goal**: Break down complex components, extract logic

#### 4.1 Component Decomposition Strategy

**Sidebar.tsx Refactoring**:
1. Extract `WorkTitleButton` → `presentation/components/work/WorkTitleButton.tsx`
2. Extract `WorkListScroller` → `presentation/components/work/WorkListScroller.tsx`
3. Extract scroll logic → `domain/hooks/useWorkListScroll.ts`
4. Extract layout logic → `domain/hooks/useSidebarLayout.ts`
5. Create `presentation/components/layout/SidebarContainer.tsx` (smart component)
6. Create presentational components:
   - `SentenceCategoryList.tsx`
   - `ExhibitionCategoryList.tsx`

**SentenceCategory.tsx Refactoring**:
1. Extract state logic → `domain/hooks/useKeywordState.ts`
2. Extract animation variants → `core/constants/animations.ts`
3. Extract styling logic → `domain/hooks/useKeywordStyle.ts`
4. Create `AnimatedKeyword.tsx` component
5. Simplify parent component to composition

**FloatingWorkWindow.tsx Refactoring**:
1. Remove data fetching - pass work as prop
2. Extract positioning logic → `domain/hooks/useFloatingPosition.ts`
3. Extract thumbnail logic → `domain/hooks/useThumbnailUrl.ts`
4. Simplify to pure presentational component

#### 4.2 Create Style System
Create `presentation/styles/`
- `theme.css` - CSS variables
- `animations.css` - Reusable animations
- Consider CSS modules for component-specific styles

#### 4.3 Component Testing Strategy
- Unit tests for business logic hooks
- Component tests for presentational components
- Integration tests for smart components

### Phase 5: State Management (Low Risk)
**Goal**: Add global state management for UI state

#### 5.1 Create Contexts
Create `state/contexts/`
- `CategorySelectionContext.tsx` - Selected category state
- `WorkSelectionContext.tsx` - Selected work state
- `UIStateContext.tsx` - Hover states, modal states

#### 5.2 Optional: Zustand for Complex State
If contexts become too complex:
```bash
npm install zustand
```

Create `state/stores/`
- `useCategoryStore.ts`
- `useWorkStore.ts`

### Phase 6: Error Handling & Loading States (Low Risk)

#### 6.1 Create Error Boundaries
Create `presentation/components/errors/`
- `ErrorBoundary.tsx`
- `ErrorFallback.tsx`
- `NotFound.tsx`

#### 6.2 Create Loading Components
Create `presentation/components/loading/`
- `LoadingSpinner.tsx`
- `WorkSkeleton.tsx`
- `CategorySkeleton.tsx`

#### 6.3 Error Handling in Hooks
Add proper error handling to all custom hooks with React Query's error handling

### Phase 7: Performance Optimization (Medium Risk)

#### 7.1 Memoization
- Add `React.memo` to pure presentational components
- Use `useMemo` for expensive computations
- Use `useCallback` for event handlers passed as props

#### 7.2 Code Splitting
- Lazy load heavy components (Framer Motion components)
- Dynamic imports for detail pages

#### 7.3 Image Optimization
- Review Next.js Image component usage
- Add proper `sizes` prop
- Consider blur placeholders

## Risk Assessment

### High Risk Areas ⚠️
1. **Component Animation Logic** (SentenceCategory.tsx)
   - Complex character-by-character animations
   - Framer Motion variants
   - Risk: Breaking visual effects
   - Mitigation: Visual regression testing, careful extraction

2. **Layout Calculations** (Sidebar.tsx)
   - Complex positioning logic
   - Scroll behavior
   - Risk: Layout shifts, broken scrolling
   - Mitigation: Thorough manual testing on different screen sizes

3. **Floating Window Positioning** (FloatingWorkWindow.tsx)
   - Boundary detection
   - Dynamic positioning
   - Risk: Windows appearing off-screen
   - Mitigation: Unit tests for positioning logic

### Medium Risk Areas
- Data fetching transition to React Query
- Component hierarchy changes
- State management changes

### Low Risk Areas
- Folder structure changes
- Type organization
- Constants extraction
- Error boundaries

## Implementation Order

### Week 1: Foundation
- [ ] Create folder structure
- [ ] Move and organize types
- [ ] Extract constants
- [ ] Set up testing framework

### Week 2: Data Layer
- [ ] Move API clients
- [ ] Implement repositories
- [ ] Set up React Query
- [ ] Write repository tests

### Week 3: Domain Layer
- [ ] Create custom hooks for data fetching
- [ ] Extract business logic hooks
- [ ] Write hook tests

### Week 4: Component Refactoring (Part 1)
- [ ] Refactor WorkTitleButton
- [ ] Refactor WorkListScroller
- [ ] Extract scroll logic
- [ ] Visual testing

### Week 5: Component Refactoring (Part 2)
- [ ] Refactor FloatingWorkWindow
- [ ] Refactor SentenceCategory
- [ ] Extract animation logic
- [ ] Visual testing

### Week 6: Component Refactoring (Part 3)
- [ ] Refactor Sidebar
- [ ] Create layout hooks
- [ ] Integration testing
- [ ] Visual regression testing

### Week 7: State Management & Error Handling
- [ ] Set up contexts
- [ ] Create error boundaries
- [ ] Add loading states
- [ ] Error handling tests

### Week 8: Performance & Polish
- [ ] Add memoization
- [ ] Code splitting
- [ ] Performance testing
- [ ] Final QA

## Testing Strategy

### Unit Tests
- All custom hooks
- Repository functions
- Utility functions
- State derivation logic

### Component Tests
- Presentational components in isolation
- Prop variations
- User interactions

### Integration Tests
- Smart components with contexts
- Data fetching flows
- Category/work selection flows

### Visual Regression Tests
- Critical UI components
- Animation states
- Layout variations (mobile, tablet, desktop)

### E2E Tests
- Category selection → work display
- Work detail navigation
- Floating window interactions

## Rollback Strategy

1. **Git Worktree Isolation**
   - All changes in separate worktree
   - Main branch unaffected
   - Easy to abandon if needed

2. **Feature Flags**
   - For gradual rollout
   - A/B testing new components

3. **Incremental Migration**
   - Keep old code alongside new
   - Switch gradually
   - Remove old code only when confident

## Success Criteria

### Code Quality
- [ ] TypeScript strict mode enabled
- [ ] No `any` types
- [ ] 80%+ test coverage
- [ ] All ESLint rules passing
- [ ] No console errors/warnings

### Performance
- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] No layout shifts (CLS = 0)

### Architecture
- [ ] Clean separation of concerns
- [ ] All components follow SRP
- [ ] Business logic in hooks
- [ ] Data layer properly abstracted

### User Experience
- [ ] All animations working correctly
- [ ] No visual regressions
- [ ] Responsive on all screen sizes
- [ ] Accessibility score > 95

## Notes & Considerations

### Dependencies to Add
```json
{
  "@tanstack/react-query": "^5.x",
  "@tanstack/react-query-devtools": "^5.x",
  "zustand": "^4.x" // if needed
}
```

### Dependencies to Consider
- CSS-in-JS library (styled-components, emotion) or stick with CSS modules
- Testing libraries (already has vitest)
- Visual regression testing (playwright, chromatic)

### Breaking Changes
- Component APIs will change (props, naming)
- Import paths will change
- May need to update admin package if it depends on front types

### Migration Path
1. Start with data layer (least risky)
2. Move to domain layer (hooks)
3. Refactor components incrementally
4. Add state management last
5. Performance optimization throughout

## Open Questions
1. Should we use CSS modules, CSS-in-JS, or plain CSS?
2. Do we need Zustand or are contexts sufficient?
3. Should we add Storybook for component development?
4. What's the visual regression testing strategy?
5. Should we align with admin package architecture?

---

**Next Steps**:
1. Review this plan with team/stakeholder
2. Set up development environment in new worktree
3. Create feature branch protection rules
4. Begin Phase 1: Foundation Layer Setup
