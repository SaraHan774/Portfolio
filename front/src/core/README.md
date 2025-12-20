# Core Layer

The Core layer contains foundational code used across all other layers. This layer has no dependencies on other application layers.

## Structure

```
core/
├── constants/      # Application constants
├── types/          # TypeScript type definitions
├── errors/         # Custom error classes
└── utils/          # Pure utility functions
```

## Guidelines

### Constants
- Use `as const` for immutable objects
- Group related constants together
- Export from index.ts for easy access

### Types
- Organize by domain (work, category, settings, user)
- Use descriptive names
- Document complex types with comments
- Prefer interfaces over type aliases for objects

### Errors
- Extend from AppError base class
- Include error codes for categorization
- Provide helpful error messages

### Utils
- Pure functions only (no side effects)
- Well-tested with unit tests
- Single responsibility per function
- Properly typed with TypeScript

## Usage Examples

```typescript
// Import types
import type { Work, Category } from '@/types';

// Import constants
import { FIREBASE_COLLECTIONS, ROUTES } from '@/core/constants';

// Import utilities
import { getThumbnailUrl, formatWorkTitle } from '@/core/utils';

// Import errors
import { NotFoundError } from '@/core/errors';
```

## Dependencies

- No dependencies on other application layers
- Only external type packages allowed
- Keep this layer lightweight and reusable
