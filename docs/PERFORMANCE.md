# PERFORMANCE.md: 성능 최적화 전략

---

## 1. 렌더링 최적화

### 1.1 React.memo

Props가 자주 바뀌지 않는 컴포넌트에 사용.

```typescript
// ✅ 작품 카드는 선택된 작품이 바뀌어도 다른 카드는 리렌더링하지 않음
const WorkCard = React.memo(
  ({ work, onSelect }: WorkCardProps) => (
    <div onClick={() => onSelect(work.id)}>
      <img src={work.thumbnailUrl} alt={work.title} />
    </div>
  ),
  (prev, next) => prev.work.id === next.work.id
);
```

### 1.2 useMemo

계산 비용이 크거나 하위 컴포넌트에 객체/배열을 Props로 전달할 때.

```typescript
// ✅ 카테고리 필터 결과 메모이제이션
function useFilteredWorks(works: Work[], categoryId: string) {
  return useMemo(
    () => works.filter(w => w.categoryId === categoryId),
    [works, categoryId]
  );
}
```

### 1.3 useCallback

콜백을 자식 컴포넌트 Props로 전달할 때.

```typescript
// ✅ onSelect 함수 참조 유지 (WorkCard 리렌더 방지)
const handleSelect = useCallback((id: string) => {
  setSelectedWorkId(id);
}, []);
```

### 1.4 Context 분리 (front)

Context를 하나로 합치면 무관한 컴포넌트까지 리렌더됩니다.

```typescript
// ✅ 분리된 Context (front/state/contexts/)
// - UIStateContext: 모달 열림/닫힘, 로딩
// - WorkSelectionContext: 선택된 작품
// - CategorySelectionContext: 선택된 카테고리
// - CategoriesContext: 카테고리 목록 데이터
```

---

## 2. 데이터 캐싱 (TanStack Query)

### 2.1 캐시 설정 기준

```typescript
// 데이터 변경 빈도에 따라 staleTime 조정
export function useWorks() {
  return useQuery({
    queryKey: queryKeys.works.published,
    queryFn: () => workRepository.getPublished(),
    staleTime: 5 * 60 * 1000,   // 5분간 캐시 재검증 안 함
    gcTime: 10 * 60 * 1000,     // 10분 후 메모리에서 제거
  });
}
```

### 2.2 Optimistic Update (admin)

작품 순서 변경처럼 즉각적인 UI 반응이 필요한 경우.

```typescript
const reorderWorks = useMutation({
  mutationFn: (newOrder: string[]) => workRepository.updateOrder(newOrder),
  onMutate: async (newOrder) => {
    await queryClient.cancelQueries({ queryKey: queryKeys.works.all });
    const previous = queryClient.getQueryData(queryKeys.works.all);

    queryClient.setQueryData(queryKeys.works.all, (old: Work[]) =>
      newOrder.map(id => old.find(w => w.id === id)!).filter(Boolean)
    );

    return { previous };
  },
  onError: (_, __, context) => {
    queryClient.setQueryData(queryKeys.works.all, context?.previous);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.works.all });
  },
});
```

---

## 3. 이미지 최적화

### 3.1 Next.js Image (front)

```typescript
// ✅ Next.js Image 컴포넌트 사용 (자동 최적화, lazy loading)
import Image from 'next/image';

<Image
  src={work.thumbnailUrl}
  alt={work.title}
  width={400}
  height={300}
  loading="lazy"
  placeholder="blur"
  blurDataURL={work.blurHash}
/>
```

`next.config.ts`에 Firebase Storage 도메인을 remotePatterns에 등록해야 합니다.

### 3.2 Firebase Storage 이미지 (admin)

```typescript
// ✅ 업로드 전 클라이언트 사이드 리사이즈
async function resizeBeforeUpload(file: File, maxWidth = 1920): Promise<File> {
  return new Promise(resolve => {
    const canvas = document.createElement('canvas');
    const img = new window.Image();
    img.onload = () => {
      const ratio = Math.min(maxWidth / img.width, 1);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(blob => resolve(new File([blob!], file.name, { type: 'image/jpeg' })), 'image/jpeg', 0.85);
    };
    img.src = URL.createObjectURL(file);
  });
}
```

---

## 4. 번들 최적화

### 4.1 코드 스플리팅 (admin — Vite + React Router)

```typescript
import { lazy, Suspense } from 'react';

const WorkForm = lazy(() => import('./pages/WorkForm'));
const Categories = lazy(() => import('./pages/Categories'));
const Settings = lazy(() => import('./pages/Settings'));

function App() {
  return (
    <Suspense fallback={<Spin />}>
      <Routes>
        <Route path="/works/new" element={<WorkForm />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Suspense>
  );
}
```

### 4.2 Next.js 자동 코드 스플리팅 (front)

Next.js는 페이지 단위로 자동 스플리팅합니다. 무거운 라이브러리는 dynamic import 사용.

```typescript
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false,
});
```

### 4.3 Ant Design 트리 쉐이킹 (admin)

```typescript
// ✅ 필요한 컴포넌트만 임포트
import { Table, Button, Form } from 'antd';

// ❌ 전체 임포트 금지
import antd from 'antd';
```

### 4.4 번들 분석 (admin)

```bash
# vite.config.ts에 추가
import { visualizer } from 'rollup-plugin-visualizer';

plugins: [react(), visualizer({ open: true })]

npm run build  # dist/stats.html 확인
```

---

## 5. 리스트 최적화 (admin)

작품 목록이 수백 개가 되면 가상화 고려.

```typescript
// ✅ TanStack Table + 가상 스크롤 (필요 시)
import { useVirtualizer } from '@tanstack/react-virtual';

function WorksList({ works }: { works: Work[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: works.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
  });

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map(item => (
          <WorkRow key={item.key} work={works[item.index]} />
        ))}
      </div>
    </div>
  );
}
```

---

## 6. 성능 측정

### 6.1 Web Vitals (front)

Next.js에서 `web-vitals` 패키지로 Core Web Vitals 측정:

```typescript
// pages/_app.tsx 또는 app/layout.tsx
export function reportWebVitals(metric: NextWebVitalsMetric) {
  // LCP, CLS, FID, FCP, TTFB
  console.log(metric);
}
```

### 6.2 React DevTools Profiler

불필요한 리렌더 확인:
1. React DevTools 확장 설치
2. Profiler 탭 → Record → 상호작용 → Stop
3. 리렌더된 컴포넌트와 원인 확인

---

## 체크리스트

- [ ] `staleTime` / `gcTime` 설정
- [ ] 불필요한 리렌더 제거 (Profiler 확인)
- [ ] 목록 컴포넌트에 `React.memo` 적용
- [ ] `useCallback` / `useMemo` 콜백/객체 Props에 적용
- [ ] Next.js `Image` 컴포넌트 사용 (front)
- [ ] 업로드 전 이미지 리사이즈 (admin)
- [ ] 코드 스플리팅 (admin 페이지)
- [ ] Ant Design named import (트리 쉐이킹)

---

**더 보기**: `docs/NETWORK.md`
