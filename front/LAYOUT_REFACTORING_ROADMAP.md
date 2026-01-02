# Layout Refactoring Roadmap

PortfolioLayout의 JavaScript 높이 측정 방식을 CSS Grid 기반으로 전환하는 로드맵

## 📊 현재 문제점

### 1. **Timing Mismatch**
```
1. React render (초기값 없음)
2. Browser paint
3. ResizeObserver 측정 완료
4. paddingTop 업데이트 → Re-render
5. Browser repaint (Layout Shift) ❌
```

### 2. **SSR Hydration 불일치**
- Server: JS 미실행 → paddingTop = 0px
- Client: 측정 후 → paddingTop = 380px
- 결과: Hydration mismatch 경고

### 3. **복잡한 의존성**
```typescript
const contentPaddingTop = useMemo(() => {
  // 5개 이상의 state에 의존
  // 각 변경마다 재계산
  // 예측 불가능한 업데이트 순서
}, [sentenceCategoryHeight, exhibitionCategoryHeight, workListScrollerHeight, hasData, ...]);
```

---

## 🎯 Phase 1: 즉시 개선 (완료)

**목표**: 현재 구조 유지하면서 타이밍 이슈 최소화

### 구현 내용

#### 1. 추정값 사용 (Layout Shift 방지)
```typescript
const LAYOUT_CONSTANTS = {
  ESTIMATED_CATEGORY_HEIGHT: 120,
  ESTIMATED_WORKLIST_HEIGHT: 80,
  ESTIMATED_TOTAL_PADDING: 312, // 초기 렌더링 시 사용
};

const [contentPaddingTop, setContentPaddingTop] = useState<string>(
  `${LAYOUT_CONSTANTS.ESTIMATED_TOTAL_PADDING}px` // 초기값
);
```

#### 2. useLayoutEffect로 동기 측정
```typescript
useLayoutEffect(() => {
  // DOM 업데이트 전에 측정 (paint 전)
  const actualHeight = measureActualHeight();
  if (actualHeight !== ESTIMATED_TOTAL_PADDING) {
    setContentPaddingTop(`${actualHeight}px`);
  }
}, [sentenceCategoryHeight, exhibitionCategoryHeight]);
```

#### 3. RAF + Debounce 최적화
```typescript
useOptimizedResize(() => {
  // 150ms debounce + RAF로 최적화
  logLayout('windowResize', { optimized: 'RAF+debounce' });
}, { delay: 150 });
```

### 성과
- ✅ 초기 Layout Shift 감소 (추정값 사용)
- ✅ 측정 타이밍 개선 (useLayoutEffect)
- ✅ Resize 성능 향상 (RAF)
- ⚠️ 여전히 JavaScript 의존

---

## 🚀 Phase 2: CSS Grid 마이그레이션 준비

**기간**: 2-3주
**목표**: CSS Grid로 전환 준비, 점진적 마이그레이션 시작

### 2.1 구조 분석 및 설계

#### 현재 구조
```tsx
<div className="flex flex-col">
  <div className="flex-1 relative">
    {/* Absolute positioned categories */}
    <CategorySidebar ... />

    {/* Absolute positioned work list */}
    <div className="absolute work-list-scroller-container">
      <WorkListScroller ... />
    </div>

    {/* Content with dynamic paddingTop */}
    <div style={{ paddingTop: contentPaddingTop }}>
      {children}
    </div>
  </div>

  <Footer />
</div>
```

#### 목표 구조 (CSS Grid)
```tsx
<div className="portfolio-grid-layout">
  {/* Left column: Categories + WorkList */}
  <aside className="sidebar-column">
    <CategorySidebar ... />
    <WorkListScroller ... />
  </aside>

  {/* Right column: Main content */}
  <main className="content-column">
    {children}
  </main>

  <Footer className="footer-full-width" />
</div>
```

### 2.2 CSS Grid 스타일 정의

```css
.portfolio-grid-layout {
  display: grid;
  grid-template-columns:
    minmax(300px, 25%) /* Sidebar */
    1fr;               /* Content */
  grid-template-rows:
    1fr                /* Main area */
    auto;              /* Footer */
  gap: var(--space-6);
  min-height: calc(100vh - 40px);
}

.sidebar-column {
  grid-column: 1;
  grid-row: 1;

  /* Sticky positioning */
  position: sticky;
  top: var(--space-8);
  align-self: start;

  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.content-column {
  grid-column: 2;
  grid-row: 1;

  /* No paddingTop calculation needed! */
}

.footer-full-width {
  grid-column: 1 / -1; /* Span all columns */
  grid-row: 2;
}

/* Responsive: Mobile */
@media (max-width: 767px) {
  .portfolio-grid-layout {
    grid-template-columns: 1fr; /* Single column */
  }

  .sidebar-column {
    position: relative; /* Not sticky on mobile */
    top: 0;
  }
}
```

### 2.3 마이그레이션 체크리스트

#### Week 1: 준비
- [ ] CSS Grid 레이아웃 CSS 파일 작성
- [ ] 새 PortfolioLayoutGrid 컴포넌트 생성 (기존과 병행)
- [ ] Feature flag 설정 (환경변수로 전환 가능하도록)

#### Week 2: 테스트
- [ ] 개발 환경에서 Grid 레이아웃 테스트
- [ ] 모든 페이지에서 레이아웃 확인
- [ ] 반응형 breakpoint 테스트 (xs/sm/md/lg/xl)
- [ ] 브라우저 호환성 테스트

#### Week 3: 배포 준비
- [ ] A/B 테스트 설정
- [ ] 성능 메트릭 수집 (LCP, CLS)
- [ ] 롤백 계획 수립

### 2.4 제거될 코드

```typescript
// ❌ 더 이상 필요 없음
const [sentenceCategoryHeight, setSentenceCategoryHeight] = useState(0);
const [exhibitionCategoryHeight, setExhibitionCategoryHeight] = useState(0);
const [workListScrollerHeight, setWorkListScrollerHeight] = useState(0);

// ❌ 더 이상 필요 없음
const contentPaddingTop = useMemo(() => {
  const totalHeight =
    LAYOUT_CONSTANTS.BASE_TOP_OFFSET +
    categoryHeight +
    LAYOUT_CONSTANTS.CATEGORY_TO_WORKLIST_GAP +
    workListScrollerHeight +
    LAYOUT_CONSTANTS.CATEGORY_TO_WORKLIST_GAP;

  return `${totalHeight}px`;
}, [...dependencies]);

// ❌ 더 이상 필요 없음
useEffect(() => {
  const resizeObserver = new ResizeObserver(updateHeight);
  resizeObserver.observe(element);
}, [...]);
```

### 2.5 성과 예상

| 항목 | Before (Phase 1) | After (Phase 2) |
|------|------------------|-----------------|
| JavaScript 의존 | 높음 | **없음** ✅ |
| 초기 Layout Shift | 최소 | **없음** ✅ |
| SSR Hydration | 추정값 사용 | **완벽** ✅ |
| 코드 복잡도 | 중간 | **낮음** ✅ |
| 성능 (CLS) | 0.05 | **0.00** ✅ |
| 유지보수성 | 중간 | **높음** ✅ |

---

## 🎨 Phase 3: 전체 CSS Grid 구현

**기간**: 4-6주
**목표**: 모든 레이아웃을 CSS Grid/Flexbox로 전환, JavaScript 높이 계산 완전 제거

### 3.1 컴포넌트별 마이그레이션

#### CategorySidebar.tsx
```typescript
// Before: 높이 측정 콜백
interface CategorySidebarProps {
  onSentenceCategoryHeightChange: (height: number) => void; // ❌ 제거
  onExhibitionCategoryHeightChange: (height: number) => void; // ❌ 제거
}

// After: 순수 UI 컴포넌트
interface CategorySidebarProps {
  // 높이 관련 props 완전 제거
  sentenceCategories: Category[];
  exhibitionCategories: Category[];
  selectedKeywordId: string | null;
  selectedExhibitionCategoryId: string | null;
  onKeywordSelect: (id: string) => void;
  onExhibitionCategorySelect: (id: string) => void;
}
```

#### WorkListScroller.tsx
```typescript
// Before: absolute positioning with calculated top
<div
  ref={workListRef}
  className="absolute"
  style={{
    top: `${calculatedTop}px`, // ❌ JavaScript 계산
    left: 'var(--category-margin-left)',
  }}
>

// After: CSS Grid placement
<div className="work-list-grid-item">
  {/* Grid가 자동으로 위치 결정 */}
</div>
```

```css
.work-list-grid-item {
  /* 부모 Grid에서 자동 배치 */
  grid-column: 1;
  grid-row: 2; /* Categories 다음 */
}
```

### 3.2 전체 레이아웃 구조

```tsx
// PortfolioLayoutGrid.tsx (최종 버전)

export default function PortfolioLayoutGrid({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const { selectedKeywordId, selectedExhibitionCategoryId, ... } = useCategorySelection();
  const { sentenceCategories, exhibitionCategories } = useCategories();
  const { works } = useFilteredWorks(selectedKeywordId, selectedExhibitionCategoryId);

  // ✅ 높이 측정 관련 state 완전 제거!
  // ✅ ResizeObserver 관련 코드 완전 제거!
  // ✅ useLayoutEffect 측정 코드 완전 제거!

  return (
    <div className="portfolio-grid-layout">
      {/* Sidebar Column */}
      <aside className="sidebar-column">
        {/* Categories */}
        <CategorySidebar
          sentenceCategories={sentenceCategories}
          exhibitionCategories={exhibitionCategories}
          selectedKeywordId={selectedKeywordId}
          selectedExhibitionCategoryId={selectedExhibitionCategoryId}
          onKeywordSelect={handleKeywordSelect}
          onExhibitionCategorySelect={handleExhibitionCategorySelect}
          selectedWorkIds={selectedWorkIds}
          // ❌ height change callbacks 제거됨
        />

        {/* Work List */}
        {works.length > 0 && (
          <WorkListScroller
            works={works}
            selectedWorkId={selectedWorkId}
            onWorkSelect={handleWorkSelect}
            showThumbnail={selectedWorkId === null}
            direction={workListConfig?.position === 'left' ? 'ltr' : 'rtl'}
          />
        )}
      </aside>

      {/* Content Column */}
      <main className="content-column">
        {/* ✅ paddingTop 계산 완전 제거! */}
        {children}
      </main>

      {/* Footer (full width) */}
      <Footer />
    </div>
  );
}
```

### 3.3 CSS 최종 구조

```css
/* globals.css */

/* Desktop Layout (1024px+) */
.portfolio-grid-layout {
  display: grid;
  grid-template-columns:
    minmax(300px, 400px) /* Sidebar: 고정 범위 */
    1fr;                 /* Content: 나머지 */
  grid-template-rows:
    1fr    /* Main content area */
    auto;  /* Footer */
  column-gap: var(--space-8); /* 64px */
  row-gap: 0;
  min-height: calc(100vh - 40px);
  padding: var(--space-5) var(--space-6); /* 40px 48px */
}

.sidebar-column {
  grid-column: 1;
  grid-row: 1;

  /* Sticky 동작 */
  position: sticky;
  top: var(--space-8); /* 64px from top */
  align-self: start;
  height: fit-content;

  /* 내부 레이아웃 */
  display: flex;
  flex-direction: column;
  gap: var(--space-6); /* 48px between categories and work list */
}

.content-column {
  grid-column: 2;
  grid-row: 1;

  /* Content-driven height */
  min-height: 100%;

  /* No padding calculation! */
}

.portfolio-footer {
  grid-column: 1 / -1; /* Span both columns */
  grid-row: 2;

  /* Footer styles */
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

/* Tablet Layout (768px ~ 1023px) */
@media (max-width: 1023px) {
  .portfolio-grid-layout {
    grid-template-columns:
      minmax(250px, 300px)
      1fr;
    column-gap: var(--space-6); /* 48px */
  }
}

/* Mobile Layout (767px and below) */
@media (max-width: 767px) {
  .portfolio-grid-layout {
    grid-template-columns: 1fr; /* Single column */
    grid-template-rows:
      auto  /* Sidebar */
      1fr   /* Content */
      auto; /* Footer */
    row-gap: var(--space-6);
  }

  .sidebar-column {
    grid-column: 1;
    grid-row: 1;

    /* Remove sticky on mobile */
    position: relative;
    top: 0;
  }

  .content-column {
    grid-column: 1;
    grid-row: 2;
  }

  .portfolio-footer {
    grid-column: 1;
    grid-row: 3;

    /* Center on mobile */
    justify-content: center;
  }
}
```

### 3.4 성능 비교

#### Before (JavaScript Height Calculation)
```
Initial Load:
1. React render with paddingTop: 0px
2. Browser paint (Layout Shift) ❌
3. JS measures heights
4. Re-render with paddingTop: 380px
5. Browser repaint (Layout Shift) ❌

Resize:
1. Resize event fires
2. Debounce 150ms
3. RAF
4. JS recalculates heights
5. State updates
6. Re-render
7. Browser repaint

Total Time: ~300-400ms
Layout Shifts: 2-3
```

#### After (CSS Grid)
```
Initial Load:
1. React render
2. Browser paint (Grid calculates layout) ✅
Done!

Resize:
1. Resize event fires
2. Browser recalculates Grid layout ✅
Done!

Total Time: ~16ms (1 frame)
Layout Shifts: 0
```

### 3.5 코드 감소

| 파일 | Before | After | 감소율 |
|------|--------|-------|--------|
| PortfolioLayout.tsx | ~450 lines | ~200 lines | **-55%** |
| CategorySidebar.tsx | ~200 lines | ~150 lines | **-25%** |
| WorkListScroller.tsx | ~270 lines | ~200 lines | **-26%** |
| **Total** | **920 lines** | **550 lines** | **-40%** |

### 3.6 삭제되는 파일/코드

```typescript
// ❌ 완전히 제거되는 코드

// 1. Height measurement state
const [sentenceCategoryHeight, setSentenceCategoryHeight] = useState(0);
const [exhibitionCategoryHeight, setExhibitionCategoryHeight] = useState(0);
const [workListScrollerHeight, setWorkListScrollerHeight] = useState(0);

// 2. Height change callbacks
const handleSentenceCategoryHeightChange = useCallback(...);
const handleExhibitionCategoryHeightChange = useCallback(...);

// 3. ResizeObserver effects
useEffect(() => {
  const resizeObserver = new ResizeObserver(updateHeight);
  resizeObserver.observe(element);
  return () => resizeObserver.disconnect();
}, [...]);

// 4. PaddingTop calculation
const contentPaddingTop = useMemo(() => {
  const totalHeight = BASE + categoryHeight + GAP + workListHeight + GAP;
  return `${totalHeight}px`;
}, [...dependencies]);

// 5. WorkListConfig calculation
const workListConfig = useMemo(() => {
  if (selectedKeywordId && sentenceCategoryHeight > 0) {
    return {
      position: 'left',
      top: BASE + sentenceCategoryHeight + GAP,
    };
  }
  return null;
}, [...]);

// 총 제거 코드: ~200 lines
```

---

## 📊 최종 비교표

| 항목 | Phase 1 (현재) | Phase 2 (준비) | Phase 3 (완료) |
|------|---------------|---------------|---------------|
| **JavaScript 의존** | 높음 | 중간 | **없음** ✅ |
| **코드 복잡도** | 중간 | 중간 | **낮음** ✅ |
| **Layout Shift** | 최소 | 최소 | **없음** ✅ |
| **SSR 호환** | 추정값 | 추정값 | **완벽** ✅ |
| **성능 (CLS)** | 0.05 | 0.03 | **0.00** ✅ |
| **유지보수성** | 중간 | 중간 | **높음** ✅ |
| **코드 라인** | 920 | 800 | **550** ✅ |
| **브라우저 지원** | 100% | 100% | **98%** ⚠️ |

---

## 🚦 마이그레이션 전략

### 단계별 전환

#### Step 1: Feature Flag (1주)
```typescript
// .env
NEXT_PUBLIC_USE_GRID_LAYOUT=false

// PortfolioLayout.tsx
export default function PortfolioLayout(props: Props) {
  const useGridLayout = process.env.NEXT_PUBLIC_USE_GRID_LAYOUT === 'true';

  if (useGridLayout) {
    return <PortfolioLayoutGrid {...props} />;
  }

  return <PortfolioLayoutLegacy {...props} />;
}
```

#### Step 2: A/B Testing (2주)
```typescript
// 50% 트래픽에 Grid 레이아웃 적용
const useGridLayout = Math.random() > 0.5;

// 성능 메트릭 수집
analytics.track('layout_type', {
  type: useGridLayout ? 'grid' : 'legacy',
  cls: performanceMetrics.cls,
  lcp: performanceMetrics.lcp,
});
```

#### Step 3: 점진적 롤아웃 (1주)
```
Day 1: 10% 트래픽
Day 3: 25% 트래픽
Day 5: 50% 트래픽
Day 7: 100% 트래픽 (완료)
```

#### Step 4: 레거시 코드 제거 (1주)
```bash
# Grid 레이아웃 안정화 후
git rm src/presentation/components/layout/PortfolioLayoutLegacy.tsx
git commit -m "Remove legacy layout implementation"
```

---

## ✅ 체크리스트

### Phase 2 완료 조건
- [ ] CSS Grid 레이아웃 CSS 작성 완료
- [ ] PortfolioLayoutGrid 컴포넌트 구현
- [ ] 모든 페이지에서 정상 동작 확인
- [ ] 반응형 breakpoint 테스트 통과
- [ ] 성능 메트릭 (CLS < 0.03, LCP < 2.5s)
- [ ] 브라우저 호환성 테스트 통과
- [ ] Feature flag 설정 완료

### Phase 3 완료 조건
- [ ] Grid 레이아웃 100% 트래픽 배포
- [ ] 레거시 코드 완전 제거
- [ ] 성능 개선 확인 (CLS = 0.00)
- [ ] 문서 업데이트 (ARCHITECTURE.md)
- [ ] 팀 공유 및 교육

---

## 📚 참고 자료

### CSS Grid 학습 자료
- [CSS Grid Layout Guide (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout)
- [A Complete Guide to Grid (CSS-Tricks)](https://css-tricks.com/snippets/css/complete-guide-grid/)
- [Grid by Example](https://gridbyexample.com/)

### 성능 메트릭
- [Web Vitals (Google)](https://web.dev/vitals/)
- [Cumulative Layout Shift (CLS)](https://web.dev/cls/)
- [Largest Contentful Paint (LCP)](https://web.dev/lcp/)

### 브라우저 지원
- [CSS Grid Browser Support](https://caniuse.com/css-grid)
- 지원율: 98.5% (IE 제외)

---

**작성일**: 2026-01-01
**마지막 업데이트**: Phase 1 완료 후
