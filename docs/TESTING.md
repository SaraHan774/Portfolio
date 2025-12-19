# TESTING.md: 테스트 전략

## 테스트 피라미드

```
        ╱╲
       ╱  ╲      E2E (사용자 시나리오)
      ╱    ╲     10-15% 테스트
     ╱──────╲
    ╱        ╲
   ╱          ╲   통합 (Hook, 컴포넌트)
  ╱            ╲  30-40% 테스트
 ╱──────────────╲
╱                ╲
╱──────────────────╲ 유닛 (함수, 로직)
                    45-60% 테스트
```

## 1. 유닛 테스트 (함수/로직)

### 1.1 순수 함수 테스트

```typescript
// core/utils/wineScore.ts
export function calculateWineScore(
  rating: number,
  vintage: number,
  ageYears: number
): number {
  if (rating < 1 || rating > 10) {
    throw new RangeError('Rating must be between 1-10');
  }
  return rating + (ageYears * 0.1);
}

// core/utils/wineScore.test.ts
import { describe, it, expect } from 'vitest';
import { calculateWineScore } from './wineScore';

describe('calculateWineScore', () => {
  it('should calculate score correctly', () => {
    const score = calculateWineScore(8, 2015, 8);
    expect(score).toBe(8.8); // 8 + (8 * 0.1)
  });

  it('should throw error for invalid rating', () => {
    expect(() => calculateWineScore(11, 2015, 8))
      .toThrow(RangeError);
  });

  it('should handle edge cases', () => {
    expect(calculateWineScore(1, 2015, 0)).toBe(1);
    expect(calculateWineScore(10, 2015, 0)).toBe(10);
  });
});
```

### 1.2 에러 클래스 테스트

```typescript
// core/errors/CustomError.ts
export class ValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// core/errors/CustomError.test.ts
import { describe, it, expect } from 'vitest';
import { ValidationError } from './CustomError';

describe('ValidationError', () => {
  it('should create error with field', () => {
    const error = new ValidationError('Invalid email', 'email');
    expect(error.message).toBe('Invalid email');
    expect(error.field).toBe('email');
    expect(error.name).toBe('ValidationError');
  });
});
```

## 2. 통합 테스트

### 2.1 Custom Hook 테스트

```typescript
// domain/hooks/useUserManagement.ts
export function useUserManagement(userId: string) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await userRepository.getById(userId);
        setUser(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  return { user, loading, error };
}

// domain/hooks/useUserManagement.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useUserManagement } from './useUserManagement';
import * as userRepository from '../../data/repository/userRepository';

vi.mock('../../data/repository/userRepository');

describe('useUserManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch user on mount', async () => {
    const mockUser = { id: '1', name: 'John Doe', email: 'john@example.com' };
    vi.spyOn(userRepository, 'getById').mockResolvedValue(mockUser);

    const { result } = renderHook(() => useUserManagement('1'));

    // 초기 상태
    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();

    // 로드 완료 후
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.error).toBeNull();
  });

  it('should handle error', async () => {
    const mockError = new Error('Network error');
    vi.spyOn(userRepository, 'getById').mockRejectedValue(mockError);

    const { result } = renderHook(() => useUserManagement('1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.error).toEqual(mockError);
  });
});
```

### 2.2 Repository 테스트 (Mock API)

```typescript
// data/repository/userRepository.ts
export const userRepository = {
  async getById(id: string): Promise<User> {
    const cached = cacheManager.get(`user:${id}`);
    if (cached) return cached;

    const user = await userApi.getUser(id);
    cacheManager.set(`user:${id}`, user, 5 * 60 * 1000);
    return user;
  },
};

// data/repository/userRepository.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userRepository } from './userRepository';
import * as userApi from '../api/userApi';
import * as cacheManager from '../cache/cacheManager';

vi.mock('../api/userApi');
vi.mock('../cache/cacheManager');

describe('userRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should get user from API and cache', async () => {
    const mockUser = { id: '1', name: 'John' };
    vi.mocked(cacheManager.get).mockReturnValue(null);
    vi.mocked(userApi.getUser).mockResolvedValue(mockUser);

    const result = await userRepository.getById('1');

    expect(result).toEqual(mockUser);
    expect(userApi.getUser).toHaveBeenCalledWith('1');
    expect(cacheManager.set).toHaveBeenCalledWith(
      'user:1',
      mockUser,
      5 * 60 * 1000
    );
  });

  it('should return cached user', async () => {
    const cachedUser = { id: '1', name: 'John' };
    vi.mocked(cacheManager.get).mockReturnValue(cachedUser);

    const result = await userRepository.getById('1');

    expect(result).toEqual(cachedUser);
    expect(userApi.getUser).not.toHaveBeenCalled();
  });
});
```

## 3. 컴포넌트 테스트

### 3.1 Presentational Component

```typescript
// presentation/components/UserCard.tsx
interface UserCardProps {
  user: User;
  onSelect: (id: string) => void;
}

const UserCard: React.FC<UserCardProps> = ({ user, onSelect }) => (
  <div className="user-card" onClick={() => onSelect(user.id)}>
    <h3>{user.name}</h3>
    <p>{user.email}</p>
    <button>Select</button>
  </div>
);

// presentation/components/UserCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import UserCard from './UserCard';

describe('UserCard', () => {
  const mockUser = { id: '1', name: 'John Doe', email: 'john@example.com' };

  it('should render user info', () => {
    const handleSelect = vi.fn();
    render(<UserCard user={mockUser} onSelect={handleSelect} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('should call onSelect when clicked', () => {
    const handleSelect = vi.fn();
    render(<UserCard user={mockUser} onSelect={handleSelect} />);

    fireEvent.click(screen.getByText('Select'));

    expect(handleSelect).toHaveBeenCalledWith('1');
  });
});
```

### 3.2 Container Component

```typescript
// presentation/pages/UserListPage.tsx
function UserListPage() {
  const { users, isLoading, error } = useUserManagement('all');

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      {users?.map(user => (
        <UserCard key={user.id} user={user} onSelect={() => {}} />
      ))}
    </div>
  );
}

// presentation/pages/UserListPage.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi } from 'vitest';
import UserListPage from './UserListPage';
import * as useUserManagement from '../../domain/hooks/useUserManagement';

vi.mock('../../domain/hooks/useUserManagement');

describe('UserListPage', () => {
  it('should render loading state', () => {
    vi.mocked(useUserManagement.useUserManagement).mockReturnValue({
      users: null,
      isLoading: true,
      error: null,
    });

    render(<UserListPage />);
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  it('should render users', async () => {
    const mockUsers = [
      { id: '1', name: 'John' },
      { id: '2', name: 'Jane' },
    ];

    vi.mocked(useUserManagement.useUserManagement).mockReturnValue({
      users: mockUsers,
      isLoading: false,
      error: null,
    });

    render(<UserListPage />);

    await waitFor(() => {
      expect(screen.getByText('John')).toBeInTheDocument();
      expect(screen.getByText('Jane')).toBeInTheDocument();
    });
  });
});
```

## 4. E2E 테스트 (Playwright)

### 4.1 기본 시나리오

```typescript
// e2e/user-management.spec.ts
import { test, expect } from '@playwright/test';

test.describe('User Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인
    await page.goto('http://localhost:5173/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button:has-text("Login")');
    await page.waitForURL('/dashboard');
  });

  test('should create and edit user', async ({ page }) => {
    // 사용자 생성 페이지로 이동
    await page.click('a:has-text("New User")');
    await page.waitForURL('/users/new');

    // 폼 작성
    await page.fill('input[name="name"]', 'Jane Doe');
    await page.fill('input[name="email"]', 'jane@example.com');

    // 제출
    await page.click('button:has-text("Create")');

    // 성공 메시지 확인
    await expect(page.locator('text=User created')).toBeVisible();

    // 사용자 목록에서 확인
    await page.goto('/users');
    await expect(page.locator('text=Jane Doe')).toBeVisible();
  });

  test('should delete user', async ({ page }) => {
    await page.goto('/users');

    // 사용자 찾기 및 삭제
    const userRow = page.locator('text=Jane Doe').first();
    await userRow.hover();
    await userRow.locator('button:has-text("Delete")').click();

    // 확인 다이얼로그
    await page.click('button:has-text("Confirm")');

    // 삭제 확인
    await expect(page.locator('text=User deleted')).toBeVisible();
    await expect(page.locator('text=Jane Doe')).not.toBeVisible();
  });
});
```

### 4.2 시각 회귀 테스트

```typescript
// e2e/visual.spec.ts
import { test, expect } from '@playwright/test';

test('should match snapshot', async ({ page }) => {
  await page.goto('http://localhost:5173/wines');
  
  // 페이지 전체 스크린샷
  await expect(page).toHaveScreenshot('wines-page.png');

  // 특정 요소만
  const wineCard = page.locator('.wine-card').first();
  await expect(wineCard).toHaveScreenshot('wine-card.png');
});
```

## 5. 성능 테스트

### 5.1 Lighthouse CI

```bash
# .lighthouserc.json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:5173"],
      "numberOfRuns": 3
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 0.9 }]
      }
    }
  }
}

# package.json
"scripts": {
  "lighthouse": "lhci autorun"
}
```

### 5.2 성능 벤치마크

```typescript
// core/utils/wineScore.benchmark.ts
import { bench, describe } from 'vitest';
import { calculateWineScore } from './wineScore';

describe('calculateWineScore performance', () => {
  bench('should calculate quickly', () => {
    calculateWineScore(8, 2015, 8);
  });
});

// 실행
npm run bench
```

## 6. 테스트 설정

### 6.1 Vitest 설정

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
      ],
      lines: 80,
      functions: 80,
      branches: 75,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### 6.2 테스트 유틸리티

```typescript
// src/test/setup.ts
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// 각 테스트 후 cleanup
afterEach(() => {
  cleanup();
});

// Mock 설정
vi.mock('../../api/userApi', () => ({
  userApi: {
    getUser: vi.fn(),
  },
}));

// src/test/render.tsx
import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
}

const renderWithProviders = (
  ui: ReactElement,
  { queryClient = createTestQueryClient(), ...renderOptions }: ExtendedRenderOptions = {}
) =>
  render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>,
    renderOptions
  );

export { renderWithProviders as render };
```

## 테스트 커맨드

```bash
# 모든 테스트 실행
npm run test

# Watch 모드
npm run test:watch

# 커버리지
npm run test:coverage

# 특정 파일만
npm run test src/domain

# E2E 테스트
npm run test:e2e

# Lighthouse
npm run lighthouse
```

## 테스트 체크리스트

- [ ] 순수 함수 테스트 (유닛)
- [ ] Hook 테스트 (통합)
- [ ] Repository 테스트 (Mock API)
- [ ] 컴포넌트 테스트
- [ ] 주요 사용자 시나리오 E2E
- [ ] 에러 케이스 테스트
- [ ] 커버리지 80% 이상
- [ ] CI/CD에 테스트 자동화

---

**더 보기**: `docs/ARCHITECTURE.md`, `docs/SECURITY.md`
