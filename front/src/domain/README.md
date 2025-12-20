# Domain Layer

The Domain layer contains business logic and custom hooks. This is where application-specific logic lives.

## Structure

```
domain/
├── hooks/          # Custom React hooks
└── services/       # Business logic services (if needed)
```

## Guidelines

### Custom Hooks
- Encapsulate business logic
- Use React Query hooks for data fetching
- Combine multiple data sources if needed
- Return loading/error states
- Follow naming convention: `use*`

### Hook Types

**Data Hooks**: Wrap repository calls with React Query
```typescript
export const usePublishedWorks = () => {
  return useQuery({
    queryKey: queryKeys.works.published(),
    queryFn: () => workRepository.getPublishedWorks(),
  });
};
```

**Business Logic Hooks**: Manage complex state and logic
```typescript
export const useWorkSelection = () => {
  // Selection logic, filtering, etc.
};
```

**UI Logic Hooks**: Extract reusable UI logic
```typescript
export const useFloatingPosition = (targetRef) => {
  // Position calculation logic
};
```

## Usage Examples

```typescript
// In components
import { usePublishedWorks, useWorkSelection } from '@/domain/hooks';

function WorkList() {
  const { data: works, isLoading } = usePublishedWorks();
  const { selectedWork, selectWork } = useWorkSelection();

  // ...
}
```

## Dependencies

- Can use Core and Data layers
- No dependency on Presentation or State layers
- React and React Query for hooks
