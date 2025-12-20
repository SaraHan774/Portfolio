# Domain Layer

The domain layer contains business logic and custom hooks that bridge the data layer with the presentation layer.

## Structure

```
domain/
├── hooks/              # Custom React hooks
│   ├── useWorks.ts     # Data fetching hooks for works
│   ├── useCategories.ts # Data fetching hooks for categories
│   ├── useSiteSettings.ts # Data fetching hooks for settings
│   ├── useWorkSelection.ts # Work selection state management
│   ├── useCategorySelection.ts # Category selection state management
│   ├── useWorkFiltering.ts # Work filtering logic
│   └── useThumbnailUrl.ts # Thumbnail URL calculation
└── __tests__/
    └── hooks/          # Tests for all hooks
```

## Custom Hooks

### Data Fetching Hooks

#### useWorks.ts
Provides React Query hooks for fetching works data with proper caching:

```typescript
const { data: works, isLoading } = usePublishedWorks();
const { data: work } = useWork(workId);
const { data: works } = useWorksByKeyword(keywordId);
const { data: works } = useWorksByExhibitionCategory(categoryId);
const { data: works } = useWorksByIds(['id1', 'id2']);
```

#### useCategories.ts
Provides React Query hooks for fetching categories:

```typescript
const { data: categories } = useSentenceCategories();
const { data: categories } = useExhibitionCategories();
const { data: keyword } = useKeyword(keywordId);
```

#### useSiteSettings.ts
Provides React Query hook for site settings:

```typescript
const { data: settings } = useSiteSettings();
```

### Business Logic Hooks

#### useWorkSelection.ts
Manages work selection and hover state:

```typescript
const {
  selectedWork,
  hoveredWorkId,
  selectWork,
  setHoveredWorkId,
  isWorkSelected,
  isWorkHovered,
} = useWorkSelection();
```

#### useCategorySelection.ts
Manages category selection (sentence or exhibition):

```typescript
const {
  selectedCategory,
  selectCategory,
  clearSelection,
  isCategorySelected,
} = useCategorySelection();

selectCategory('sentence', 'keyword-id');
selectCategory('exhibition', 'exhibition-id');
```

#### useWorkFiltering.ts
Filters works by category with memoization:

```typescript
const { filteredWorks, isFiltering, filterCount } = useWorkFiltering({
  works,
  keywordId: 'keyword1',
});
```

#### useThumbnailUrl.ts
Calculates thumbnail URL from work data:

```typescript
const thumbnailUrl = useThumbnailUrl(work);
// Or use utility function
const url = getThumbnailUrl(work);
```

## Caching Strategy

- **Works**: 5-10 minute stale time
- **Categories**: 10 minute stale time (change infrequently)
- **Settings**: 30 minute stale time (change very infrequently)

## Testing

All business logic hooks have comprehensive test coverage:
- useWorkSelection: 8 tests
- useCategorySelection: 9 tests
- useWorkFiltering: 10 tests
- useThumbnailUrl: 9 tests

Run tests:
```bash
npm test src/domain
```

## Design Principles

1. **Single Responsibility**: Each hook has one clear purpose
2. **Composition**: Hooks can be composed for complex behavior
3. **Memoization**: Proper use of useMemo and useCallback
4. **Conditional Fetching**: Data only fetches when needed

## Usage Example

```typescript
import {
  usePublishedWorks,
  useWorkSelection,
  useCategorySelection,
  useWorkFiltering,
} from '@/domain/hooks';

function WorkGallery() {
  const { data: works } = usePublishedWorks();
  const { selectedWork, selectWork } = useWorkSelection();
  const { selectedCategory } = useCategorySelection();
  const { filteredWorks } = useWorkFiltering({
    works,
    keywordId: selectedCategory?.id,
  });

  return (
    <div>
      {filteredWorks.map(work => (
        <div key={work.id} onClick={() => selectWork(work)}>
          {work.title}
        </div>
      ))}
    </div>
  );
}
```
