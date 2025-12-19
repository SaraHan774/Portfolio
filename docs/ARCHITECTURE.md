# ARCHITECTURE.md: 프로젝트 구조 및 설계

## 레이어별 책임 (Clean Architecture)

```
┌─────────────────────────────────────┐
│     Presentation Layer              │  UI, 라우팅, 폼 관리
├─────────────────────────────────────┤
│     Domain Layer                    │  비즈니스 로직, Custom Hooks
├─────────────────────────────────────┤
│     Data Layer                      │  API, Repository, 캐시
├─────────────────────────────────────┤
│     Core Layer                      │  타입, 상수, 유틸
└─────────────────────────────────────┘
```

의존성은 아래로만 향함 (단방향):
- Presentation → Domain
- Domain → Data
- Domain → Core
- Data → Core

## 폴더 구조 상세

### `core/`

프로젝트 전체에서 사용하는 기본 요소들. **UI 비의존적**.

```
core/
├── constants/
│   ├── api.ts          # API 엔드포인트, 타임아웃 등
│   └── config.ts       # 환경 설정
├── types/
│   ├── api.ts          # API 모델 (User, Post 등)
│   ├── domain.ts       # 도메인 모델
│   └── common.ts       # 공통 타입 (Pagination, Error)
├── errors/
│   └── CustomError.ts  # 에러 클래스 (ValidationError, NetworkError)
└── utils/
    ├── date.ts         # 순수 함수: formatDate, parseDate
    ├── string.ts       # 순수 함수: slugify, truncate
    └── validation.ts   # 순수 함수: isValidEmail, isValidUrl
```

**중요**: 이곳의 함수는 **순수 함수(Pure Function)**만. 사이드이펙트 없음.

### `data/`

데이터 소스 접근. **Repository 패턴 사용** (안드로이드와 동일).

```
data/
├── api/
│   ├── client.ts       # Axios 설정, 인터셉터
│   ├── userApi.ts      # GET /users, POST /users/{id} 등
│   └── postApi.ts
├── cache/
│   └── cacheManager.ts # 로컬 스토리지/IndexedDB 관리
├── models/
│   ├── UserModel.ts    # API 응답 타입 (raw)
│   └── PostModel.ts
└── repository/
    ├── userRepository.ts   # 여러 데이터 소스 통합
    └── postRepository.ts
```

**Repository 예시**:

```typescript
// data/repository/userRepository.ts
export const userRepository = {
  async getById(id: string): Promise<User> {
    // 1. 캐시 확인
    const cached = cacheManager.get(`user:${id}`);
    if (cached) return cached;

    // 2. API 호출
    const user = await userApi.getUser(id);

    // 3. 캐시 저장
    cacheManager.set(`user:${id}`, user, 5 * 60 * 1000);

    return user;
  },

  async update(id: string, payload: UserUpdatePayload): Promise<User> {
    const updated = await userApi.updateUser(id, payload);
    // 캐시 무효화
    cacheManager.invalidate(`user:${id}`);
    return updated;
  },
};
```

### `domain/`

비즈니스 로직과 상태 관리 Hook.

```
domain/
├── services/
│   ├── userService.ts  # 복잡한 비즈니스 로직
│   └── wineScoringService.ts
├── mappers/
│   └── userMapper.ts   # API Model → Domain Model 변환
└── hooks/
    ├── useUserManagement.ts   # 사용자 관리 로직
    ├── useWineSelection.ts    # 와인 선택 로직
    └── useNotification.ts     # 공통 알림 로직
```

**Custom Hook 예시**:

```typescript
// domain/hooks/useUserManagement.ts
export function useUserManagement(userId: string) {
  const queryClient = useQueryClient();

  // 조회
  const { data: user, isLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => userRepository.getById(userId),
  });

  // 수정
  const updateMutation = useMutation({
    mutationFn: (updates: Partial<User>) =>
      userRepository.update(userId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
    },
  });

  return {
    user,
    isLoading,
    updateUser: updateMutation.mutateAsync,
  };
}
```

**중요**: Hook은 데이터와 로직만. UI 코드는 없음.

### `presentation/`

React 컴포넌트와 UI 레이어.

```
presentation/
├── components/
│   ├── common/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Card.tsx
│   ├── features/
│   │   ├── UserProfile.tsx
│   │   └── WineSelector.tsx
│   └── layouts/
│       ├── Header.tsx
│       └── Sidebar.tsx
├── pages/
│   ├── HomePage.tsx
│   ├── UserDetailPage.tsx
│   └── NotFoundPage.tsx
├── hooks/
│   ├── useForm.ts      # 폼 관련 Hook
│   └── useModal.ts     # 모달 관련 Hook
└── styles/
    ├── globals.css
    └── variables.css
```

**컴포넌트 구성 원칙**:

```typescript
// ✅ Good: Props만 받음, 로직은 없음
interface UserCardProps {
  user: User;
  onSelect: (id: string) => void;
}

const UserCard: React.FC<UserCardProps> = ({ user, onSelect }) => (
  <div onClick={() => onSelect(user.id)}>
    <h3>{user.name}</h3>
  </div>
);

// ✅ Good: 로직은 상위 컴포넌트나 Hook에서
function UserListPage() {
  const { users, isLoading, updateUser } = useUserManagement('all');

  return (
    <div>
      {users?.map(user => (
        <UserCard key={user.id} user={user} onSelect={updateUser} />
      ))}
    </div>
  );
}
```

### `state/`

전역 상태 관리 (Redux, Zustand 등).

```
state/
├── slices/
│   ├── userSlice.ts      # 사용자 관련 상태
│   └── themeSlice.ts     # 테마 관련 상태
├── selectors/
│   └── userSelectors.ts  # 상태 선택자 (memoization)
└── store.ts              # 스토어 설정
```

**Redux Slice 예시**:

```typescript
// state/slices/userSlice.ts
const userSlice = createSlice({
  name: 'user',
  initialState: { current: null, isLoading: false },
  reducers: {
    setUser: (state, action) => {
      state.current = action.payload;
    },
  },
});

// state/selectors/userSelectors.ts
export const selectUser = (state: RootState) => state.user.current;
export const selectIsLoading = (state: RootState) => state.user.isLoading;

// 메모이제이션 (성능)
export const selectUserById = createSelector(
  selectUser,
  (user) => user?.id
);
```

## 데이터 흐름

```
User Action
    ↓
Presentation Component
    ↓
Custom Hook (domain/hooks)
    ↓
Repository (data/repository)
    ↓
API Client (data/api)
    ↓
Backend API
    ↓
Response → Cache → Hook → Component → UI Update
```

## 예시: "사용자 정보 수정" 기능

### 1. Type 정의 (`core/types/api.ts`)
```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

interface UserUpdatePayload {
  name?: string;
  email?: string;
}
```

### 2. API 호출 (`data/api/userApi.ts`)
```typescript
const userApi = {
  async updateUser(id: string, payload: UserUpdatePayload) {
    return apiClient.put(`/users/${id}`, payload);
  },
};
```

### 3. Repository (`data/repository/userRepository.ts`)
```typescript
export const userRepository = {
  async update(id: string, payload: UserUpdatePayload) {
    const response = await userApi.updateUser(id, payload);
    cacheManager.invalidate(`user:${id}`);
    return response.data;
  },
};
```

### 4. Hook (`domain/hooks/useUserManagement.ts`)
```typescript
export function useUpdateUser(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => userRepository.update(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
    },
  });
}
```

### 5. Component (`presentation/pages/UserEditPage.tsx`)
```typescript
function UserEditPage({ userId }: { userId: string }) {
  const { updateAsync } = useUpdateUser(userId);

  const handleSubmit = async (formData) => {
    try {
      await updateAsync(formData);
      showNotification('User updated');
    } catch (error) {
      showError(error.message);
    }
  };

  return <UserEditForm onSubmit={handleSubmit} />;
}
```

## 순환 의존성 피하기

❌ **나쁜 예**:
```
data/ → domain/ → data/  (순환!)
```

✅ **좋은 예**:
```
presentation/ → domain/ → data/ → core/
```

**규칙**:
- Core는 아무것에도 의존하지 않음
- Data는 Core에만 의존
- Domain은 Data, Core에만 의존
- Presentation은 모두에 의존 가능

## 테스트 전략

각 레이어별 테스트:

```
core/utils/*.test.ts         # 순수 함수 테스트
data/repository/*.test.ts    # Repository 테스트 (Mock API)
domain/hooks/*.test.ts       # Hook 테스트 (React Testing Library)
presentation/components/*.test.tsx  # 컴포넌트 테스트
```

---

**더 보기**: `docs/PERFORMANCE.md`, `docs/TESTING.md`
