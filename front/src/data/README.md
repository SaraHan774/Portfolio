# Data Layer

The Data layer handles all external data access and caching. It provides a clean abstraction over data sources.

## Structure

```
data/
├── api/            # API clients (Firestore operations)
│   ├── client.ts           # Firebase initialization
│   ├── worksApi.ts         # Works CRUD operations
│   ├── categoriesApi.ts    # Categories CRUD operations
│   └── settingsApi.ts      # Settings CRUD operations
├── mappers/        # Data transformation logic
│   ├── workMapper.ts       # Firestore → Work type mapping
│   ├── categoryMapper.ts   # Firestore → Category type mapping
│   └── settingsMapper.ts   # Firestore → Settings type mapping
├── repository/     # Repository pattern implementations
│   ├── WorkRepository.ts       # Work data access with query keys
│   ├── CategoryRepository.ts   # Category data access with query keys
│   └── SettingsRepository.ts   # Settings data access with query keys
└── cache/          # React Query cache configuration
    └── queryKeys.ts        # Query key factories
```

## Guidelines

### API Clients
- One client per data source (worksApi, categoriesApi, etc.)
- Handle raw data fetching and transformation
- Map Firestore documents to application types
- No business logic - pure data access

### Repositories
- Provide high-level data access interface
- Use API clients internally
- Can combine multiple API clients
- Return domain types

### Cache
- React Query configuration
- Query key factories
- Cache invalidation strategies
- Optimistic updates

## Usage Examples

### In Custom Hooks (Domain Layer)

```typescript
import { useQuery } from '@tanstack/react-query';
import { WorkRepository } from '@/data';

export const usePublishedWorks = () => {
  return useQuery({
    queryKey: WorkRepository.getPublishedWorksKey(),
    queryFn: () => WorkRepository.getPublishedWorks(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
```

### Direct Repository Usage

```typescript
import { WorkRepository, CategoryRepository } from '@/data';

// Fetch published works
const works = await WorkRepository.getPublishedWorks();

// Fetch sentence categories
const categories = await CategoryRepository.getSentenceCategories();
```

## Dependencies

- Can use Core layer (types, constants, errors, utils)
- External data libraries (React Query, Firebase)
- No dependency on Domain or Presentation layers
