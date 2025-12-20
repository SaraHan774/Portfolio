# Data Layer

The Data layer handles all external data access and caching. It provides a clean abstraction over data sources.

## Structure

```
data/
├── api/            # API clients (Firestore, REST, etc.)
├── repositories/   # Repository pattern implementations
└── cache/          # React Query setup and cache config
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

```typescript
// Use repositories in hooks
import { workRepository } from '@/data/repositories';

const works = await workRepository.getPublishedWorks();
```

## Dependencies

- Can use Core layer (types, constants, errors, utils)
- External data libraries (React Query, Firebase)
- No dependency on Domain or Presentation layers
