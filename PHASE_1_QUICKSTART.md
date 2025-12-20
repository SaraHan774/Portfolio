# Phase 1 Quick Start Guide

**Phase**: Foundation Layer Setup
**Risk Level**: ⚠️ Low
**Estimated Time**: 1 week
**Goal**: Set up proper folder structure without changing logic

## Prerequisites

- [x] New git worktree created (`refactor/front`)
- [ ] WebStorm IDE opened for the worktree
- [ ] Dependencies installed (`npm install`)
- [ ] Tests passing (`npm test`)

## Step-by-Step Tasks

### Step 1: Create Folder Structure (30 mins)

```bash
cd /Users/gahee/Portfolio-front/front

# Create core layer
mkdir -p src/core/{constants,types,errors,utils}

# Create data layer
mkdir -p src/data/{api,repositories,cache}

# Create domain layer
mkdir -p src/domain/{hooks,services}

# Create presentation layer
mkdir -p src/presentation/{components,pages,styles}

# Create state layer
mkdir -p src/state/{contexts,stores}

# Create test directory structure
mkdir -p src/__tests__/{core,data,domain,presentation}
```

**Verify**:
```bash
tree src -L 2 -d
```

Expected output:
```
src/
├── core/
│   ├── constants/
│   ├── types/
│   ├── errors/
│   └── utils/
├── data/
│   ├── api/
│   ├── repositories/
│   └── cache/
├── domain/
│   ├── hooks/
│   └── services/
├── presentation/
│   ├── components/
│   ├── pages/
│   └── styles/
└── state/
    ├── contexts/
    └── stores/
```

---

### Step 2: Move Types to Core Layer (1 hour)

#### 2.1 Split types into domain files

Create new type files:

**`src/core/types/work.types.ts`**:
```typescript
// Copy Work, WorkImage, WorkVideo, MediaItem types from types/index.ts
export interface Work {
  id: string;
  title: string;
  year?: number;
  shortDescription?: string;
  fullDescription: string;
  thumbnailImageId: string;
  images: WorkImage[];
  videos?: WorkVideo[];
  caption?: string;
  sentenceCategoryIds: string[];
  exhibitionCategoryIds: string[];
  isPublished: boolean;
  viewCount?: number;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

export interface WorkImage {
  id: string;
  url: string;
  thumbnailUrl: string;
  listThumbnailUrl?: string;
  mediumUrl?: string;
  webpUrl?: string;
  order: number;
  width: number;
  height: number;
  fileSize?: number;
  uploadedFrom?: 'desktop' | 'mobile' | 'camera';
}

export interface WorkVideo {
  id: string;
  youtubeUrl: string;
  youtubeVideoId: string;
  embedUrl: string;
  title?: string;
  order: number;
  width?: number;
  height?: number;
}

export type MediaItem =
  | { type: 'image'; data: WorkImage }
  | { type: 'video'; data: WorkVideo };
```

**`src/core/types/category.types.ts`**:
```typescript
export interface KeywordCategory {
  id: string;
  name: string;
  startIndex: number;
  endIndex: number;
  workOrders: WorkOrder[];
}

export interface SentenceCategory {
  id: string;
  sentence: string;
  keywords: KeywordCategory[];
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExhibitionCategory {
  id: string;
  title: string;
  description: {
    exhibitionType: string;
    venue: string;
    year: number;
  };
  displayOrder: number;
  workOrders: WorkOrder[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkOrder {
  workId: string;
  order: number;
}

export type CategoryState = 'basic' | 'clickable' | 'hover' | 'active' | 'disabled';

/** @deprecated Use ExhibitionCategory instead */
export type TextCategory = ExhibitionCategory;
```

**`src/core/types/settings.types.ts`**:
```typescript
export interface SiteSettings {
  id: string;
  browserTitle: string;
  browserDescription: string;
  faviconUrl?: string;
  footerText: string;
  updatedAt: Date;
}
```

**`src/core/types/user.types.ts`**:
```typescript
export interface User {
  id: string;
  email: string;
  googleId: string;
  displayName: string;
  profileImage?: string;
  role: 'admin' | 'viewer';
  createdAt: Date;
  lastLoginAt: Date;
}
```

**`src/core/types/index.ts`** (barrel export):
```typescript
// Re-export all types from a single entry point
export * from './work.types';
export * from './category.types';
export * from './settings.types';
export * from './user.types';
```

#### 2.2 Update tsconfig.json

Add path alias for cleaner imports:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./app/*"],
      "@/core/*": ["./src/core/*"],
      "@/data/*": ["./src/data/*"],
      "@/domain/*": ["./src/domain/*"],
      "@/presentation/*": ["./src/presentation/*"],
      "@/state/*": ["./src/state/*"],
      "@/types": ["./src/core/types"]
    }
  }
}
```

#### 2.3 Update imports in existing code

**Option A: Gradual (Recommended)**
- Keep `types/index.ts` as re-export from `src/core/types/index.ts`
- No immediate breaking changes
- Migrate imports gradually

**Option B: All at once**
- Remove `types/index.ts`
- Update all imports to `@/types`
- Run find & replace: `@/types` → `@/types`

**Verify**:
```bash
npm run build
npm test
```

---

### Step 3: Extract Constants (1 hour)

#### 3.1 Firebase Constants

**`src/core/constants/firebase.constants.ts`**:
```typescript
export const FIREBASE_COLLECTIONS = {
  WORKS: 'works',
  SENTENCE_CATEGORIES: 'sentenceCategories',
  EXHIBITION_CATEGORIES: 'exhibitionCategories',
  SETTINGS: 'settings',
  USERS: 'users',
} as const;

export const SETTINGS_DOC_ID = 'site';

export const FIRESTORE_BATCH_LIMIT = 10;
```

#### 3.2 UI Constants

**`src/core/constants/ui.constants.ts`**:
```typescript
// Animation durations (ms)
export const ANIMATION_DURATION = {
  FAST: 100,
  NORMAL: 200,
  SLOW: 300,
  VERY_SLOW: 500,
} as const;

// Floating window
export const FLOATING_WINDOW = {
  OFFSET_X: 12,
  OFFSET_Y: 8,
  WIDTH: 320,
  HEIGHT: 180,
  BOUNDARY_PADDING: 10,
} as const;

// Scroll
export const SCROLL_AMOUNT = 200;

// Thumbnail sizes
export const THUMBNAIL_SIZE = {
  SMALL: 80,
  MEDIUM: 120,
  LARGE: 200,
} as const;

// CSS variable defaults
export const CSS_VARIABLES = {
  SPACE_UNIT: 8, // 8px base spacing
  CATEGORY_MARGIN_LEFT: '48px',
  CATEGORY_MARGIN_RIGHT: '48px',
  CONTENT_GAP: '32px',
  DOT_OFFSET_TOP: '-8px',
} as const;
```

#### 3.3 Route Constants

**`src/core/constants/routes.constants.ts`**:
```typescript
export const ROUTES = {
  HOME: '/',
  WORK_DETAIL: (id: string) => `/works/${id}`,
  WORKS: '/works',
} as const;
```

#### 3.4 Animation Constants

**`src/core/constants/animation.constants.ts`**:
```typescript
import type { Variants } from 'framer-motion';

// Keyword animation variants
export const KEYWORD_ANIMATION_VARIANTS: Record<string, Variants> = {
  container: {
    hover: {
      transition: {
        staggerChildren: 0.03, // 30ms stagger (left-to-right effect)
      },
    },
    selected: {
      transition: {
        staggerChildren: 0, // Instant
      },
    },
    normal: {
      transition: {
        staggerChildren: 0,
      },
    },
  },
  character: {
    hover: {
      fontWeight: 700,
      transition: {
        duration: 0.1,
        ease: 'easeOut',
      },
    },
    selected: {
      fontWeight: 700,
      transition: {
        duration: 0,
      },
    },
    normal: {
      fontWeight: 400,
      transition: {
        duration: 0.1,
        ease: 'easeOut',
      },
    },
  },
};

// Floating window animation
export const FLOATING_WINDOW_ANIMATION = {
  initial: { opacity: 0, y: -12, scale: 0.97 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1],
    },
  },
} as const;

// Dot indicator animation
export const DOT_ANIMATION = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.3, ease: 'easeOut', delay: 0.4 },
} as const;
```

#### 3.5 Barrel Export

**`src/core/constants/index.ts`**:
```typescript
export * from './firebase.constants';
export * from './ui.constants';
export * from './routes.constants';
export * from './animation.constants';
```

**Verify**:
```bash
npm run build
npm test
```

---

### Step 4: Create Error Classes (30 mins)

**`src/core/errors/AppError.ts`**:
```typescript
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      id ? `${resource} with id ${id} not found` : `${resource} not found`,
      'NOT_FOUND',
      404
    );
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

export class NetworkError extends AppError {
  constructor(message: string = 'Network request failed') {
    super(message, 'NETWORK_ERROR', 503);
  }
}

export class FirestoreError extends AppError {
  constructor(message: string, originalError?: unknown) {
    super(message, 'FIRESTORE_ERROR', 500);
    if (originalError instanceof Error) {
      this.stack = originalError.stack;
    }
  }
}
```

**`src/core/errors/index.ts`**:
```typescript
export * from './AppError';
```

---

### Step 5: Create Utility Functions (1 hour)

**`src/core/utils/thumbnail.utils.ts`**:
```typescript
import type { Work, WorkImage, WorkVideo } from '@/types';

/**
 * Get thumbnail URL from work
 * Priority: thumbnailImageId > first image > YouTube thumbnail
 */
export const getThumbnailUrl = (work: Work): string | null => {
  // Try to find the designated thumbnail image
  const thumbnailImage =
    work.images?.find((img) => img.id === work.thumbnailImageId) ||
    work.images?.[0];

  if (thumbnailImage) {
    return thumbnailImage.thumbnailUrl || thumbnailImage.url;
  }

  // Fallback to YouTube thumbnail
  const firstVideo = work.videos?.[0];
  if (firstVideo) {
    return getYouTubeThumbnailUrl(firstVideo);
  }

  return null;
};

/**
 * Extract YouTube video ID and get thumbnail URL
 */
export const getYouTubeThumbnailUrl = (
  video: WorkVideo
): string | null => {
  const videoId = video.youtubeVideoId?.split('?')[0]?.split('&')[0];
  return videoId
    ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    : null;
};

/**
 * Check if work has any thumbnail
 */
export const hasThumbnail = (work: Work): boolean => {
  return getThumbnailUrl(work) !== null;
};
```

**`src/core/utils/format.utils.ts`**:
```typescript
/**
 * Format work title with year
 * Format: 「'title'」, year
 */
export const formatWorkTitle = (title: string, year?: number): string => {
  return `「'${title}'」${year ? `, ${year}` : ''}`;
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Format date to locale string
 */
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};
```

**`src/core/utils/index.ts`**:
```typescript
export * from './thumbnail.utils';
export * from './format.utils';
```

---

### Step 6: Set Up Testing Framework (1 hour)

#### 6.1 Install Testing Dependencies (if not already installed)

```bash
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

#### 6.2 Create Test Utilities

**`src/__tests__/utils/test-utils.tsx`**:
```typescript
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';

// Custom render function with providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { ...options });

export * from '@testing-library/react';
export { customRender as render };
```

**`src/__tests__/utils/mock-data.ts`**:
```typescript
import type { Work, SentenceCategory, ExhibitionCategory } from '@/types';

export const mockWork = (overrides?: Partial<Work>): Work => ({
  id: 'work-1',
  title: 'Test Work',
  year: 2024,
  shortDescription: 'Short description',
  fullDescription: 'Full description',
  thumbnailImageId: 'img-1',
  images: [],
  videos: [],
  sentenceCategoryIds: [],
  exhibitionCategoryIds: [],
  isPublished: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const mockSentenceCategory = (
  overrides?: Partial<SentenceCategory>
): SentenceCategory => ({
  id: 'sentence-1',
  sentence: 'Test sentence with keywords',
  keywords: [],
  displayOrder: 0,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const mockExhibitionCategory = (
  overrides?: Partial<ExhibitionCategory>
): ExhibitionCategory => ({
  id: 'exhibition-1',
  title: 'Test Exhibition',
  description: {
    exhibitionType: '개인전',
    venue: 'Test Venue',
    year: 2024,
  },
  displayOrder: 0,
  workOrders: [],
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});
```

#### 6.3 Write Sample Tests

**`src/core/utils/__tests__/thumbnail.utils.test.ts`**:
```typescript
import { getThumbnailUrl, hasThumbnail } from '../thumbnail.utils';
import { mockWork } from '@/__tests__/utils/mock-data';

describe('thumbnail.utils', () => {
  describe('getThumbnailUrl', () => {
    it('should return thumbnail URL from image', () => {
      const work = mockWork({
        images: [
          {
            id: 'img-1',
            url: 'https://example.com/image.jpg',
            thumbnailUrl: 'https://example.com/thumb.jpg',
            order: 0,
            width: 800,
            height: 600,
          },
        ],
      });

      expect(getThumbnailUrl(work)).toBe('https://example.com/thumb.jpg');
    });

    it('should return null when no thumbnail available', () => {
      const work = mockWork({ images: [], videos: [] });
      expect(getThumbnailUrl(work)).toBeNull();
    });
  });

  describe('hasThumbnail', () => {
    it('should return true when work has thumbnail', () => {
      const work = mockWork({
        images: [
          {
            id: 'img-1',
            url: 'https://example.com/image.jpg',
            thumbnailUrl: 'https://example.com/thumb.jpg',
            order: 0,
            width: 800,
            height: 600,
          },
        ],
      });

      expect(hasThumbnail(work)).toBe(true);
    });

    it('should return false when work has no thumbnail', () => {
      const work = mockWork({ images: [], videos: [] });
      expect(hasThumbnail(work)).toBe(false);
    });
  });
});
```

**Verify**:
```bash
npm test
```

---

### Step 7: Update Package Configuration (30 mins)

#### 7.1 Update next.config.ts

Add webpack alias if needed:

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/core': './src/core',
      '@/data': './src/data',
      '@/domain': './src/domain',
      '@/presentation': './src/presentation',
      '@/state': './src/state',
    };
    return config;
  },
};

export default nextConfig;
```

#### 7.2 Update eslint config (if needed)

Ensure path aliases are recognized.

---

### Step 8: Documentation (30 mins)

Create README for each layer:

**`src/core/README.md`**:
```markdown
# Core Layer

Contains foundational code used across all layers.

## Structure

- `constants/` - Application constants
- `types/` - TypeScript type definitions
- `errors/` - Custom error classes
- `utils/` - Pure utility functions

## Guidelines

- No external dependencies (except type packages)
- No side effects
- Pure functions only
- Well-tested
```

Create similar READMEs for other layers.

---

## Validation Checklist

After completing Phase 1, verify:

- [ ] All new folders created
- [ ] Types moved and organized
- [ ] Constants extracted
- [ ] Error classes created
- [ ] Utility functions created
- [ ] Tests passing (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Application runs (`npm run dev`)
- [ ] All existing features work
- [ ] No visual regressions

---

## Git Commit Strategy

Commit after each major step:

```bash
git add src/core
git commit -m "refactor(core): create core layer structure"

git add src/core/types
git commit -m "refactor(core): move types to core layer"

git add src/core/constants
git commit -m "refactor(core): extract constants"

git add src/core/errors
git commit -m "refactor(core): create error classes"

git add src/core/utils
git commit -m "refactor(core): create utility functions"

git add src/__tests__
git commit -m "test: set up testing framework and utilities"
```

---

## Troubleshooting

### Issue: Path aliases not working

**Solution**: Restart TypeScript server in IDE
- VSCode: `Cmd+Shift+P` → "TypeScript: Restart TS Server"
- WebStorm: `File → Invalidate Caches`

### Issue: Build fails after moving types

**Solution**: Check all imports have been updated
```bash
# Find old imports
grep -r "from '@/types'" app/
grep -r "from '../types'" app/

# Update to new path
grep -r "from '@/core/types'" app/
```

### Issue: Tests fail

**Solution**: Update test imports to use new paths

---

## Next Steps

After Phase 1 completion:
1. Review changes with team
2. Merge to main or continue with Phase 2
3. Begin Phase 2: Data Layer Setup

---

**Questions or Issues?**

Document any blockers or questions in `PHASE_1_NOTES.md` for team review.
