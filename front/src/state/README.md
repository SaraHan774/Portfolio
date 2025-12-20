# State Layer

The State layer manages global UI state. For server state, use React Query in the Data layer.

## Structure

```
state/
├── contexts/       # React Context providers
└── stores/         # Zustand stores (if needed)
```

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

- Separate server state (React Query) from client state (Context/Zustand)
- Keep contexts small and focused
- Use multiple contexts instead of one large context
- Provide TypeScript types for all state

## Usage Examples

### React Context

```typescript
// contexts/CategorySelectionContext.tsx
export const CategorySelectionContext = createContext<{
  selectedKeywordId: string | null;
  selectKeyword: (id: string) => void;
}>({
  selectedKeywordId: null,
  selectKeyword: () => {},
});

// Usage in components
const { selectedKeywordId, selectKeyword } = useCategorySelection();
```

### Zustand Store (if needed)

```typescript
// stores/useCategoryStore.ts
export const useCategoryStore = create<CategoryStore>((set) => ({
  selectedKeywordId: null,
  selectKeyword: (id) => set({ selectedKeywordId: id }),
}));
```

## Dependencies

- Can use Core layer (types)
- React for contexts
- Zustand (optional, install if needed)
- No dependency on other layers
