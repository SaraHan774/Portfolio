# TESTING.md: 테스트 전략

두 앱 모두 **Vitest + Testing Library** 사용. 테스트 파일은 `src/**/__tests__/` 디렉토리에 위치합니다.

---

## 테스트 피라미드

```
        ╱╲
       ╱  ╲      E2E (Playwright — 주요 사용자 시나리오)
      ╱────╲
     ╱      ╲    통합 (Hook, Context, Repository)
    ╱────────╲
   ╱          ╲  유닛 (순수 함수, 유틸, 에러 클래스)
  ╱────────────╲
```

---

## 테스트 명령어

```bash
# front
cd front
npm run test          # watch 모드
npm run test:run      # 1회 실행
npm run test:coverage # 커버리지

# admin
cd admin
npm run test          # watch 모드
npm run test:coverage # 커버리지
```

---

## 1. 유닛 테스트 (순수 함수, 유틸)

```typescript
// core/utils/formatDate.test.ts
import { describe, it, expect } from 'vitest';
import { formatDate } from '../formatDate';

describe('formatDate', () => {
  it('Firestore Timestamp를 "YYYY.MM.DD" 형식으로 변환', () => {
    const ts = { seconds: 1700000000, nanoseconds: 0 };
    expect(formatDate(ts)).toBe('2023.11.14');
  });

  it('null이면 빈 문자열 반환', () => {
    expect(formatDate(null)).toBe('');
  });
});
```

---

## 2. Hook 테스트 (통합)

Firebase 의존성은 항상 모킹합니다.

### 2.1 TanStack Query Hook (front)

```typescript
// domain/__tests__/hooks/useWorks.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useWorks } from '../../hooks/useWorks';
import * as workRepository from '../../../data/repository/WorkRepository';

vi.mock('../../../data/repository/WorkRepository');

const wrapper = createQueryWrapper(); // QueryClientProvider 래퍼

describe('useWorks', () => {
  beforeEach(() => vi.clearAllMocks());

  it('작품 목록을 불러온다', async () => {
    const mockWorks = [{ id: '1', title: '작품1' }];
    vi.spyOn(workRepository, 'getPublished').mockResolvedValue(mockWorks);

    const { result } = renderHook(() => useWorks(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockWorks);
  });

  it('에러 상태를 처리한다', async () => {
    vi.spyOn(workRepository, 'getPublished').mockRejectedValue(new Error('fetch failed'));

    const { result } = renderHook(() => useWorks(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
```

### 2.2 Zustand 스토어 Hook (admin)

```typescript
// state/__tests__/authStore.test.ts
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuth } from '../../state/authStore';
import * as authApi from '../../data/api/authApi';

vi.mock('../../data/api/authApi');
vi.mock('../../config/firebase');

describe('useAuth', () => {
  beforeEach(() => {
    // 스토어 초기화
    useAuth.getState().reset?.();
    vi.clearAllMocks();
  });

  it('로그인 성공 시 isAuthenticated가 true가 된다', async () => {
    vi.spyOn(authApi, 'loginWithGoogle').mockResolvedValue({ uid: 'u1', email: 'a@b.com' });

    const { result } = renderHook(() => useAuth());
    await act(() => result.current.login());

    expect(result.current.isAuthenticated).toBe(true);
  });
});
```

### 2.3 모달 링크 Handler Hook (front)

```typescript
// domain/__tests__/hooks/useModalLinkHandler.test.ts
import { renderHook } from '@testing-library/react';
import { useModalLinkHandler } from '../../hooks/useModalLinkHandler';

describe('useModalLinkHandler', () => {
  it('외부 링크를 새 탭에서 열도록 처리한다', () => {
    const { result } = renderHook(() => useModalLinkHandler());
    // ...
  });
});
```

---

## 3. 컴포넌트 테스트

```typescript
// presentation/__tests__/components/WorkCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import WorkCard from '../../components/work/WorkCard';

const mockWork: Work = {
  id: '1',
  title: '테스트 작품',
  thumbnailUrl: 'https://example.com/img.jpg',
  published: true,
};

describe('WorkCard', () => {
  it('작품 제목을 렌더링한다', () => {
    render(<WorkCard work={mockWork} onSelect={vi.fn()} />);
    expect(screen.getByText('테스트 작품')).toBeInTheDocument();
  });

  it('클릭 시 onSelect를 id와 함께 호출한다', () => {
    const handleSelect = vi.fn();
    render(<WorkCard work={mockWork} onSelect={handleSelect} />);
    fireEvent.click(screen.getByRole('button'));
    expect(handleSelect).toHaveBeenCalledWith('1');
  });
});
```

---

## 4. Firebase 모킹

Firebase SDK는 직접 모킹하지 않고, Repository 계층을 모킹합니다.

```typescript
// ✅ Repository 모킹 (권장)
vi.mock('@/data/repository/WorkRepository', () => ({
  workRepository: {
    getAll: vi.fn(),
    getPublished: vi.fn(),
    update: vi.fn(),
  },
}));

// ❌ Firebase SDK 직접 모킹 (복잡하고 유지보수 어려움)
vi.mock('firebase/firestore', () => ({ ... }));
```

---

## 5. 테스트 유틸리티

### 5.1 QueryClient 래퍼

```typescript
// src/__tests__/utils/renderWithProviders.tsx (front)
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, RenderOptions } from '@testing-library/react';

export function createQueryWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
```

### 5.2 Work/Category 픽스처

```typescript
// src/__tests__/fixtures/work.ts
export const mockWork: Work = {
  id: 'work-1',
  title: '테스트 작품',
  description: '',
  categoryId: 'cat-1',
  thumbnailUrl: 'https://picsum.photos/400/300',
  mediaUrls: [],
  published: true,
  order: 0,
  createdAt: null,
  updatedAt: null,
};
```

---

## 6. E2E 테스트 (Playwright)

```typescript
// admin e2e: 작품 생성 흐름
import { test, expect } from '@playwright/test';

test('관리자가 작품을 생성한다', async ({ page }) => {
  await page.goto('http://localhost:5173/login');
  // Google OAuth는 Emulator 계정으로 로그인
  await page.click('[data-testid="login-button"]');
  await page.waitForURL('/dashboard');

  await page.click('a[href="/works/new"]');
  await page.fill('input[name="title"]', '새 작품');
  await page.click('button:has-text("저장")');

  await expect(page.locator('text=작품이 저장되었습니다')).toBeVisible();
});
```

---

## 테스트 체크리스트

- [ ] 순수 함수 유닛 테스트 (core/utils)
- [ ] Custom Hook 테스트 (domain/hooks)
- [ ] 주요 컴포넌트 렌더링 + 인터랙션 테스트
- [ ] 에러 케이스 테스트 (네트워크 실패, 권한 없음)
- [ ] Firebase 의존성은 Repository 계층에서 모킹
- [ ] 커버리지 80% 이상 유지

---

**더 보기**: `docs/ARCHITECTURE.md`, `docs/SECURITY.md`
