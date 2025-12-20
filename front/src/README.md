# Source Code Architecture

This directory contains the refactored front-end codebase following clean architecture principles.

## Layer Overview

```
src/
├── core/           # Foundation - types, constants, errors, utils
├── data/           # Data access - API clients, repositories, cache
├── domain/         # Business logic - custom hooks, services
├── presentation/   # UI - components, pages, styles
└── state/          # Global state - contexts, stores
```

## Dependency Rules

Each layer can only depend on layers below it:

```
Presentation
    ↓
  Domain
    ↓
  Data
    ↓
  Core
```

- **Core**: No dependencies on other layers
- **Data**: Can use Core
- **Domain**: Can use Core and Data
- **Presentation**: Can use Core and Domain
- **State**: Can use Core only

## Import Paths

Use TypeScript path aliases for clean imports:

```typescript
import type { Work } from '@/types';
import { ROUTES } from '@/core/constants';
import { workRepository } from '@/data/repositories';
import { usePublishedWorks } from '@/domain/hooks';
import { WorkCard } from '@/presentation/components';
import { useCategoryStore } from '@/state/stores';
```

## Directory Guidelines

- Each layer has its own README.md with detailed guidelines
- Organize files by feature/domain, not by type
- Use index.ts for barrel exports
- Keep files small and focused (< 300 lines)

## Testing

```
__tests__/
├── core/           # Core layer tests
├── data/           # Data layer tests
├── domain/         # Domain layer tests
├── presentation/   # Presentation layer tests
└── utils/          # Test utilities and mocks
```

## Migration Status

This is an incremental migration from the old flat structure:
- ✅ Phase 1: Foundation (types, constants, utilities)
- 🚧 Phase 2: Data layer (API clients, repositories)
- ⏳ Phase 3: Domain layer (custom hooks)
- ⏳ Phase 4: Presentation layer (component refactoring)
- ⏳ Phase 5: State layer (global state management)

See `FRONT_REFACTORING_PLAN.md` for the complete migration plan.
