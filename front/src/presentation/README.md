# Presentation Layer

The Presentation layer contains all UI components and pages. Components should be as pure and presentational as possible.

## Structure

```
presentation/
├── components/     # Reusable UI components
├── pages/          # Page components
└── styles/         # Shared styles (CSS modules, theme, etc.)
```

## Guidelines

### Component Types

**Presentational Components** (Preferred)
- Pure UI components
- Props in, JSX out
- No business logic
- No data fetching
- Easy to test and reuse

```typescript
interface WorkCardProps {
  work: Work;
  isSelected: boolean;
  onClick: () => void;
}

export function WorkCard({ work, isSelected, onClick }: WorkCardProps) {
  return <div onClick={onClick}>...</div>;
}
```

**Smart Components** (Container Components)
- Connect hooks to UI
- Manage local UI state
- Pass data to presentational components
- Minimal JSX

```typescript
export function WorkListContainer() {
  const { data: works } = usePublishedWorks();
  const { selectedWork, selectWork } = useWorkSelection();

  return <WorkList works={works} onSelect={selectWork} />;
}
```

### Best Practices

- Keep components small and focused
- Use TypeScript for all props
- Prefer composition over inheritance
- Extract reusable logic to custom hooks
- Use React.memo for expensive components
- Avoid inline styles (use CSS modules or styled-components)

## Usage Examples

```typescript
// Import components
import { WorkCard, WorkGrid } from '@/presentation/components';

// Use in pages
export default function HomePage() {
  return <WorkGrid />;
}
```

## Dependencies

- Can use Core, Domain layers
- React and UI libraries (Framer Motion, Next.js Image, etc.)
- No dependency on Data or State layers directly (use hooks instead)
