# Claude.md: React + TypeScript Quick Guide

프로젝트 진행 중 Claude와 협업할 때 참고하는 핵심 가이드.  
상세 문서는 `docs/` 폴더 참조.

## 폴더 구조

```
src/
├── core/           # 상수, 타입, 에러, 유틸
├── data/           # API, Repository, 캐시
├── domain/         # 비즈니스 로직, Custom Hooks
├── presentation/   # UI 컴포넌트, 페이지
└── state/          # 전역 상태 관리
```

## 핵심 원칙

### 개발

- **TypeScript**: `any` 금지, 제네릭으로 재사용성 극대화
- **함수**: 단일 책임 원칙 (SRP)
- **Custom Hook**: 비즈니스 로직은 Hook으로 캡슐화
- **컴포넌트**: 함수형만 사용 (클래스 금지)

### 네이밍

- Getter: `get*` (예: `getUserId`)
- Boolean: `is*`, `has*`, `can*` (예: `isLoading`)
- Async: 명확한 동사 (예: `fetchUser`, `createPost`)

### 성능

- **캐싱**: React Query로 데이터 캐시 (staleTime, gcTime 설정)
- **메모이제이션**: React.memo, useMemo, useCallback
- **코드 스플리팅**: 동적 import, lazy()

### 보안

- **환경변수**: `VITE_*` 프리픽스로 공개 정보만 노출
- **토큰**: HttpOnly 쿠키 또는 메모리 저장
- **XSS 방지**: dangerouslySetInnerHTML 최소화, DOMPurify 사용
- **권한**: Protected Route로 접근 제어

## 파일 작명

- API 클라이언트: `*Api.ts`
- Repository: `*Repository.ts`
- Custom Hook: `use*.ts`
- 컴포넌트: PascalCase (예: `UserCard.tsx`)
- 유틸: camelCase (예: `formatDate.ts`)

## 상세 문서

- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) - 프로젝트 구조, 레이어별 책임
- [`docs/PERFORMANCE.md`](./docs/PERFORMANCE.md) - 최적화 기법, 벤치마킹
- [`docs/NETWORK.md`](./docs/NETWORK.md) - API 설계, 캐싱, 폴링
- [`docs/SECURITY.md`](./docs/SECURITY.md) - 보안 체크리스트, 인증/인가
- [`docs/TESTING.md`](./docs/TESTING.md) - 테스트 전략, 예제

## Quick Checklist

신규 기능 개발 시:

- [ ] TypeScript 타입 명시
- [ ] Custom Hook으로 로직 분리
- [ ] React Query 캐싱 설정
- [ ] 에러 핸들링 추가
- [ ] 단위 테스트 작성
- [ ] 보안 검토 (민감 데이터 로깅 제외)
- [ ] 성능 영향 검토

---

**버전**: 1.0 | **마지막 업데이트**: 2025-12-19