# PERFORMANCE.md: 성능 최적화 전략

## 1. 렌더링 최적화

### 1.1 React.memo (컴포넌트 메모이제이션)

**언제 사용**: Props가 자주 바뀌지 않는 컴포넌트.

```typescript
// ❌ 부모가 리렌더링되면 항상 새로 렌더링
function WineCard({ wine, onSelect }: Props) {
  return <div onClick={() => onSelect(wine.id)}>{wine.name}</div>;
}

// ✅ Props가 같으면 리렌더링 스킵
const WineCard = React.memo(
  ({ wine, onSelect }: Props) => (
    <div onClick={() => onSelect(wine.id)}>{wine.name}</div>
  ),
  (prevProps, nextProps) => {
    // true: 리렌더링 스킵, false: 리렌더링 실행
    return prevProps.wine.id === nextProps.wine.id;
  }
);
```

### 1.2 useMemo (값 메모이제이션)

**언제 사용**: 계산 비용이 큰 값, 하위 컴포넌트 Props로 전달되는 객체/배열.

```typescript
// ❌ 매번 새 객체 생성 → WineList가 매번 리렌더링
function WineSelector() {
  const filters = { type: 'red', vintage: 2015 };
  return <WineList filters={filters} />;
}

// ✅ 의존성이 변경되지 않으면 같은 객체 반환
function WineSelector() {
  const filters = useMemo(() => ({
    type: 'red',
    vintage: 2015,
  }), []);
  return <WineList filters={filters} />;
}

// 의존성 있을 때
function WineSelector({ vintage }: { vintage: number }) {
  const filters = useMemo(
    () => ({ type: 'red', vintage }),
    [vintage]  // vintage가 변경되면 새 객체 생성
  );
  return <WineList filters={filters} />;
}
```

### 1.3 useCallback (함수 메모이제이션)

**언제 사용**: 콜백을 Props로 전달할 때.

```typescript
// ❌ 부모 리렌더링마다 새 함수 → 자식도 리렌더링
function WineList() {
  const handleSelect = (id: string) => {
    console.log(id);
  };
  return <WineCard onSelect={handleSelect} />;
}

// ✅ 같은 함수 참조 유지
function WineList() {
  const handleSelect = useCallback((id: string) => {
    console.log(id);
  }, []); // 의존성 명시
  return <WineCard onSelect={handleSelect} />;
}
```

### 1.4 불필요한 State 분리

```typescript
// ❌ 한 State에 여러 정보 → 하나 변경되면 전체 리렌더링
const [user, setUser] = useState({ name: '', email: '', avatar: '' });

// ✅ State 분리
const [userName, setUserName] = useState('');
const [userEmail, setUserEmail] = useState('');
const [userAvatar, setUserAvatar] = useState('');

// 또는 useReducer 사용
const [state, dispatch] = useReducer(userReducer, initialState);
```

## 2. 데이터 캐싱

### 2.1 React Query 설정

```typescript
// ✅ 효율적인 캐시 전략
const userQuery = useQuery({
  queryKey: ['user', userId],
  queryFn: () => userRepository.getById(userId),
  staleTime: 5 * 60 * 1000,      // 5분: 캐시된 데이터 사용
  gcTime: 10 * 60 * 1000,        // 10분: 메모리에서 제거
  retry: 2,                       // 실패 시 2번 재시도
  retryDelay: (attempt) =>        // 지수 백오프
    Math.min(1000 * 2 ** attempt, 30000),
});

// ✅ 백그라운드에서 주기적 갱신
const winesQuery = useQuery({
  queryKey: ['wines'],
  queryFn: () => wineRepository.getAll(),
  refetchInterval: 30 * 1000,    // 30초마다 갱신
  refetchOnWindowFocus: true,    // 창 포커스 시 갱신
});
```

### 2.2 Optimistic Update

네트워크 대기 중에 UI를 즉시 업데이트.

```typescript
const updateWineRating = useMutation({
  mutationFn: (payload) => wineRepository.updateRating(payload),
  onMutate: async (newRating) => {
    // 진행 중인 쿼리 취소
    await queryClient.cancelQueries({ queryKey: ['wines'] });

    // 이전 데이터 백업
    const previousWines = queryClient.getQueryData(['wines']);

    // 로컬 UI 즉시 업데이트
    queryClient.setQueryData(['wines'], (old: Wine[]) =>
      old.map(w => w.id === newRating.id
        ? { ...w, rating: newRating.rating }
        : w
      )
    );

    return { previousWines };
  },
  onError: (err, newRating, context) => {
    // 실패 시 롤백
    queryClient.setQueryData(['wines'], context?.previousWines);
  },
  onSuccess: () => {
    // 성공 시 서버 데이터로 다시 동기화
    queryClient.invalidateQueries({ queryKey: ['wines'] });
  },
});
```

## 3. 번들 최적화

### 3.1 코드 스플리팅

```typescript
// ✅ 경로별 번들 분리
import { lazy, Suspense } from 'react';

const HomePage = lazy(() => import('./pages/Home'));
const AdminPanel = lazy(() => import('./pages/Admin'));
const WineGallery = lazy(() => import('./pages/WineGallery'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/gallery" element={<WineGallery />} />
      </Routes>
    </Suspense>
  );
}
```

### 3.2 동적 Import

```typescript
// ✅ 필요할 때만 로드
async function loadChartLibrary() {
  const { LineChart } = await import('recharts');
  return LineChart;
}

// 또는 컴포넌트에서
const DynamicChart = lazy(() =>
  import('recharts').then(module => ({
    default: module.LineChart,
  }))
);
```

### 3.3 번들 분석

```bash
# Vite 프로젝트
npm install --save-dev vite-plugin-visualizer

# vite.config.ts
import { visualizer } from "vite-plugin-visualizer";

export default {
  plugins: [visualizer()],
};

# 빌드 후 stats.html 확인
npm run build
```

## 4. 리스트 최적화

### 4.1 가상화 (Virtualization)

수백 개 항목을 효율적으로 렌더링.

```typescript
import { FixedSizeList as List } from 'react-window';

function WineList({ wines }: { wines: Wine[] }) {
  const Row = ({ index, style }: any) => (
    <div style={style} className="wine-item">
      <h3>{wines[index].name}</h3>
      <p>{wines[index].vintage}</p>
    </div>
  );

  return (
    <List
      height={600}           // 보이는 높이
      itemCount={wines.length}
      itemSize={80}          // 각 항목 높이
      width="100%"
    >
      {Row}
    </List>
  );
}
```

### 4.2 무한 스크롤

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';

function InfiniteWineList() {
  const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ['wines'],
    queryFn: ({ pageParam = 0 }) =>
      wineRepository.getPage(pageParam, 20),
    getNextPageParam: (lastPage, pages) =>
      lastPage.hasMore ? pages.length : null,
  });

  const { ref } = useInView({
    onChange: (inView) => {
      if (inView && hasNextPage) fetchNextPage();
    },
  });

  return (
    <>
      {data?.pages.map((page) =>
        page.items.map((wine) => (
          <WineCard key={wine.id} wine={wine} />
        ))
      )}
      <div ref={ref}>{hasNextPage ? 'Loading...' : 'No more'}</div>
    </>
  );
}
```

## 5. 이미지 최적화

### 5.1 WebP + Fallback

```typescript
<picture>
  <source srcSet="wine.webp" type="image/webp" />
  <source srcSet="wine.jpg" type="image/jpeg" />
  <img src="wine.jpg" alt="Wine" />
</picture>
```

### 5.2 Lazy Loading

```typescript
<img
  src="wine.jpg"
  alt="Wine"
  loading="lazy"
  width="200"
  height="200"
/>

// 또는 라이브러리
import { LazyLoadImage } from 'react-lazy-load-image-component';

<LazyLoadImage src="wine.jpg" alt="Wine" />
```

### 5.3 반응형 이미지

```typescript
<img
  srcSet="wine-small.jpg 480w, wine-medium.jpg 960w, wine-large.jpg 1920w"
  sizes="(max-width: 480px) 100vw, (max-width: 960px) 50vw, 33vw"
  src="wine-medium.jpg"
  alt="Wine"
/>
```

## 6. 성능 측정

### 6.1 Web Vitals

```typescript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);  // Cumulative Layout Shift
getFID(console.log);  // First Input Delay
getFCP(console.log);  // First Contentful Paint
getLCP(console.log);  // Largest Contentful Paint
getTTFB(console.log); // Time to First Byte
```

### 6.2 React DevTools Profiler

```
1. React DevTools 확장 설치
2. Profiler 탭 열기
3. Record 시작 → 상호작용 → Stop
4. 어떤 컴포넌트가 렌더링되었는지 확인
```

### 6.3 성능 프로파일링

```typescript
// 함수 실행 시간 측정
function measurePerformance<T>(
  fn: () => T,
  label: string
): T {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  console.log(`${label}: ${end - start}ms`);
  return result;
}

const result = measurePerformance(
  () => expensiveCalculation(),
  'Calculate Wine Score'
);
```

## 7. 번들 크기 감소

### 7.1 의존성 최소화

```bash
# 불필요한 패키지 확인
npm ls

# 큰 패키지 찾기
npm pack && tar -tf *.tgz | wc -l

# 가벼운 대안
moment → date-fns / day.js
lodash → lodash-es (트리셰이킹)
axios → fetch API (필요하면)
```

### 7.2 Tree Shaking

```typescript
// ❌ 전체 임포트
import _ from 'lodash';

// ✅ 필요한 것만
import { debounce } from 'lodash-es';
```

## 체크리스트

성능 최적화 확인:

- [ ] 불필요한 리렌더링 제거 (React DevTools Profiler)
- [ ] React Query staleTime 설정
- [ ] 큰 컴포넌트는 React.memo 사용
- [ ] useCallback, useMemo 정확히 사용
- [ ] 코드 스플리팅 적용 (주요 경로)
- [ ] 이미지 최적화 (WebP, lazy loading)
- [ ] 번들 크기 모니터링
- [ ] Web Vitals 측정

---

**더 보기**: `docs/NETWORK.md`
