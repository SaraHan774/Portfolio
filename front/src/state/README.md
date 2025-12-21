# State Layer

The State layer manages global UI state using React Context with enhanced patterns. For server state, use React Query in the Data layer.

## Structure

```
state/
├── contexts/       # React Context providers with State/Actions/Selectors pattern
│   ├── CategorySelectionContext.tsx
│   ├── WorkSelectionContext.tsx
│   ├── UIStateContext.tsx
│   └── index.ts
└── stores/         # Zustand stores (if needed for complex state)
```

## Architecture Pattern

All contexts follow a consistent pattern with three interfaces:

1. **State Interface**: Pure state shape (data only)
2. **Actions Interface**: Functions that modify state
3. **Selectors Interface**: Derived state (computed values)

This separation provides:
- Clear contracts for state management
- Better TypeScript support
- Easier testing and maintenance
- Performance optimization opportunities

## Guidelines

### When to Use

**React Query** (Preferred for server state)
- Data from backend/Firestore
- Automatic caching and invalidation
- Loading/error states

**React Context** (For global UI state)
- Theme settings
- User preferences
- Modal/dialog state
- Selection state

**Zustand** (For complex client state)
- Complex state updates
- Performance-critical state
- Cross-component state that changes frequently

### Best Practices

- **Separate Concerns**: Use State/Actions/Selectors pattern
- **Memoization**: Use `useMemo` for selectors and context values
- **Individual Hooks**: Export granular selector hooks for fine-grained updates
- **Type Safety**: Provide explicit TypeScript interfaces
- **Server vs Client**: Keep server state (React Query) separate from client state
- **Context Size**: Keep contexts focused - multiple small contexts over one large
- **Documentation**: Add JSDoc comments for interfaces and hooks

## Implementation Examples

### Usage in Components

```typescript
// Use full context when you need multiple values
function CategoryDisplay() {
  const { selectedKeywordId, isKeywordSelected, selectKeyword } = useCategorySelection();

  return (
    <div>
      {isKeywordSelected && <p>Selected: {selectedKeywordId}</p>}
      <button onClick={() => selectKeyword('new-id')}>Select</button>
    </div>
  );
}

// Use individual hooks for performance (component only re-renders when specific value changes)
function KeywordBadge() {
  const isKeywordSelected = useIsKeywordSelected(); // Only re-renders when this changes
  return isKeywordSelected ? <Badge>Selected</Badge> : null;
}
```

## Performance Optimization

### Memoization Strategy

- **Context Value**: Always wrap in `useMemo` to prevent unnecessary re-renders
- **Actions**: Use `useCallback` for stable function references
- **Selectors**: Use `useMemo` to compute derived state only when dependencies change
- **Granular Hooks**: Export individual selector hooks for fine-grained component updates

### Example: Preventing Unnecessary Re-renders

```typescript
// ❌ Bad: Component re-renders on any context change
function WorkCount() {
  const { selectedWorkId, selectedCategoryId } = useContext(SomeContext);
  return <div>{selectedWorkId ? 1 : 0}</div>;
}

// ✅ Good: Component only re-renders when selectedWorkId changes
function WorkCount() {
  const isWorkSelected = useIsWorkSelected(); // Custom selector hook
  return <div>{isWorkSelected ? 1 : 0}</div>;
}
```

## Testing

Each context should be testable in isolation:

```typescript
import { renderHook, act } from '@testing-library/react';
import { CategorySelectionProvider, useCategorySelection } from './CategorySelectionContext';

test('selecting keyword clears exhibition category', () => {
  const { result } = renderHook(() => useCategorySelection(), {
    wrapper: CategorySelectionProvider,
  });

  act(() => {
    result.current.selectKeyword('keyword-1');
  });

  expect(result.current.selectedKeywordId).toBe('keyword-1');
  expect(result.current.isKeywordSelected).toBe(true);
  expect(result.current.selectedExhibitionCategoryId).toBeNull();
});
```

## Dependencies

- Can use Core layer (types)
- React for contexts and hooks
- Zustand (optional, install if needed)
- No dependency on Domain, Data, or Presentation layers
