# CLAUDE.md: Portfolio Project Guide

React + TypeScript 포트폴리오 프로젝트. Next.js 기반 프론트엔드, Firebase 백엔드.

## Commands

### front (Next.js 포트폴리오 사이트)
```bash
cd front
npm run dev               # 개발 서버
npm run dev:emulator      # Firebase Emulator 연결
npm run build             # 빌드
npm run lint              # 린트
npm run test              # 테스트 (watch)
npm run test:run          # 테스트 (1회)
npm run test:coverage     # 커버리지
```

### admin (Vite 관리자 대시보드)
```bash
cd admin
npm run dev               # 개발 서버 (port 5173)
npm run dev:emulator      # Firebase Emulator 연결
npm run emulators         # Firebase Emulator 시작 (데이터 유지)
npm run build             # 빌드
npm run test              # 테스트 (watch)
npm run test:coverage     # 커버리지
npm run deploy            # 빌드 + Firebase Hosting 배포
```

### Firebase Emulator (로컬 개발)
```bash
# 루트 디렉토리에서
firebase emulators:start --project portfolio-nhb

# UI: http://localhost:4000
# Auth: localhost:9099 | Firestore: localhost:8080 | Storage: localhost:9199
```

## 기술 스택

| | front | admin |
|--|-------|-------|
| **Framework** | Next.js 16 | Vite 7 |
| **React** | 19.2.0 | 19.1.1 |
| **Router** | Next.js App Router | React Router 7 |
| **State (서버)** | TanStack Query v5 | TanStack Query v5 |
| **State (전역)** | React Context | Zustand 5 |
| **UI** | Tailwind v4, Framer Motion | Ant Design 5 |
| **Rich Text** | — | TipTap 3 |
| **Auth** | 없음 (공개 사이트) | Firebase Auth (Google OAuth) |
| **Test** | Vitest + Testing Library | Vitest + Testing Library |

## 폴더 구조

두 앱 모두 동일한 Clean Architecture 레이어 구조를 따릅니다.

```
{app}/src/
├── core/           # 상수, 타입, 에러, 유틸
├── data/           # API (Firebase), Repository, Mapper, 캐시 키
├── domain/         # 비즈니스 로직 (Custom Hooks)
├── presentation/   # UI 컴포넌트, 페이지
└── state/          # 전역 상태 (front: Context / admin: Zustand)
```

## 코딩 원칙

- TypeScript `any` 금지 — 제네릭 또는 명시적 타입 사용
- 비즈니스 로직은 `domain/hooks/` Custom Hook으로 캡슐화
- 함수형 컴포넌트만 사용 (클래스 컴포넌트 금지)
- 단일 책임 원칙 (SRP) 준수

## 네이밍

| 용도 | 패턴 | 예시 |
|------|------|------|
| Getter | `get*` | `getUserId` |
| Boolean | `is*`, `has*`, `can*` | `isLoading` |
| Async | 명확한 동사 | `fetchUser`, `createPost` |
| Hook | `use*` | `useModalState` |
| 컴포넌트 | PascalCase | `WorkCard.tsx` |
| 유틸 | camelCase | `formatDate.ts` |

## 금지 사항

- `any` 타입 사용 금지
- 클래스 컴포넌트 사용 금지
- `dangerouslySetInnerHTML` 무분별한 사용 금지 (필요 시 DOMPurify 적용)
- 민감 데이터 로깅 금지
- 환경변수에 `VITE_*` / `NEXT_PUBLIC_*` 외 비공개 정보 노출 금지

## 성능

- TanStack Query: `staleTime`, `gcTime` 반드시 설정
- `React.memo`, `useMemo`, `useCallback` 으로 불필요한 리렌더 방지
- 동적 import + `lazy()`로 코드 스플리팅

## 테스트

- Custom Hook: `renderHook` + `act` 사용
- 컴포넌트: Testing Library (`getByRole`, `findBy*` 우선)
- 외부 의존성 (Firebase 등) 모킹 필수
- 테스트 파일 위치: `src/**/__tests__/`

## 상세 문서

- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — 레이어별 책임
- [`docs/PERFORMANCE.md`](./docs/PERFORMANCE.md) — 최적화 기법
- [`docs/NETWORK.md`](./docs/NETWORK.md) — API 설계, 캐싱
- [`docs/SECURITY.md`](./docs/SECURITY.md) — 보안 체크리스트
- [`docs/TESTING.md`](./docs/TESTING.md) — 테스트 전략

---

**마지막 업데이트**: 2026-03-22
