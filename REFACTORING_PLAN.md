# Portfolio Refactoring Plan

프로젝트를 Clean Architecture로 점진적 리팩토링하기 위한 단계별 계획.

## 현재 상태 vs 목표

### 현재 Admin 구조
```
src/
├── __tests__/
├── components/
├── config/
├── hooks/
├── layouts/
├── pages/
├── services/
├── stores/
└── types/
```

### 목표 구조 (Clean Architecture)
```
src/
├── core/           # 상수, 타입, 에러, 유틸 (UI 비의존)
├── data/           # API, Repository, 캐시
├── domain/         # 비즈니스 로직, Custom Hooks
├── presentation/   # UI 컴포넌트, 페이지
├── state/          # 전역 상태 관리
└── __tests__/      # 테스트 (레이어별 구조 미러링)
```

---

## Phase 1: Testing Infrastructure ✅ (완료)

**브랜치**: `refactor/phase-1-testing`

### 완료 항목
- [x] Vitest 설정 (admin, front)
- [x] React Testing Library 설정
- [x] 테스트 작성
  - [x] authStore (13 tests)
  - [x] useWorks hooks (11 tests)
  - [x] CaptionEditor component (19 tests)
- [x] 빌드 및 린트 통과

---

## Phase 2: Core Layer 생성

**브랜치**: `refactor/phase-2-core`

### 목표
기본 타입, 상수, 유틸리티 함수를 `core/` 레이어로 분리

### 작업 항목

#### 2.1 Types 마이그레이션
- [ ] `src/core/types/` 디렉토리 생성
- [ ] `types/index.ts` → `core/types/` 분리
  - `core/types/api.ts` - API 모델 (Work, User, Image 등)
  - `core/types/domain.ts` - 도메인 모델
  - `core/types/common.ts` - 공통 타입 (Pagination, Error)
- [ ] 기존 import 경로 업데이트

#### 2.2 Constants 생성
- [ ] `src/core/constants/` 디렉토리 생성
- [ ] `config/` → `core/constants/` 이동
  - `core/constants/api.ts` - API 엔드포인트, 타임아웃
  - `core/constants/config.ts` - 환경 설정 (Firebase 등)
- [ ] 기존 import 경로 업데이트

#### 2.3 Utils 생성
- [ ] `src/core/utils/` 디렉토리 생성
- [ ] 순수 함수 추출 (services에서 분리)
  - `core/utils/date.ts` - 날짜 포맷팅
  - `core/utils/string.ts` - 문자열 처리
  - `core/utils/validation.ts` - 유효성 검사

#### 2.4 Errors 생성
- [ ] `src/core/errors/` 디렉토리 생성
- [ ] 커스텀 에러 클래스 정의
  - `ValidationError`
  - `NetworkError`
  - `AuthError`

### 테스트
- [ ] `core/utils/` 순수 함수 테스트 작성

---

## Phase 3: Data Layer 리팩토링

**브랜치**: `refactor/phase-3-data`

### 목표
API 클라이언트와 Repository 패턴으로 데이터 접근 로직 분리

### 작업 항목

#### 3.1 API 클라이언트 정리
- [ ] `src/data/api/` 디렉토리 생성
- [ ] Firebase 클라이언트 분리
  - `data/api/client.ts` - Firebase 초기화 및 설정
  - `data/api/worksApi.ts` - Works CRUD API
  - `data/api/authApi.ts` - 인증 API
  - `data/api/imagesApi.ts` - 이미지 업로드 API
  - `data/api/categoriesApi.ts` - 카테고리 API

#### 3.2 Repository 패턴 적용
- [ ] `src/data/repository/` 디렉토리 생성
- [ ] Repository 구현
  - `data/repository/worksRepository.ts`
  - `data/repository/categoriesRepository.ts`
  - `data/repository/imagesRepository.ts`

#### 3.3 캐시 레이어 (선택)
- [ ] `src/data/cache/` 디렉토리 생성
- [ ] React Query 캐시 설정 중앙화

### 테스트
- [ ] Repository 테스트 작성 (Mock API 사용)

---

## Phase 4: Domain Layer 정리

**브랜치**: `refactor/phase-4-domain`

### 목표
비즈니스 로직을 Domain 레이어로 이동, Hook 정리

### 작업 항목

#### 4.1 Hooks 마이그레이션
- [ ] `src/domain/hooks/` 디렉토리 생성
- [ ] 비즈니스 로직 Hook 이동
  - `domain/hooks/useWorks.ts` - Works 관리 로직
  - `domain/hooks/useAuth.ts` - 인증 관리 로직
  - `domain/hooks/useCategories.ts` - 카테고리 관리 로직
  - `domain/hooks/useImageUpload.ts` - 이미지 업로드 로직

#### 4.2 Services (비즈니스 로직)
- [ ] `src/domain/services/` 디렉토리 생성
- [ ] 복잡한 비즈니스 로직 분리
  - 예: 이미지 최적화 로직, 정렬 로직

#### 4.3 Mappers
- [ ] `src/domain/mappers/` 디렉토리 생성
- [ ] API Model → Domain Model 변환 함수

### 테스트
- [ ] Hook 테스트 보강

---

## Phase 5: Presentation Layer 정리

**브랜치**: `refactor/phase-5-presentation`

### 목표
UI 컴포넌트를 체계적으로 정리

### 작업 항목

#### 5.1 Components 구조화
- [ ] `src/presentation/components/` 디렉토리 생성
- [ ] 컴포넌트 분류
  - `presentation/components/common/` - 재사용 컴포넌트 (Button, Input, Card)
  - `presentation/components/features/` - 기능 컴포넌트 (WorkCard, CategorySelector)
  - `presentation/components/layouts/` - 레이아웃 (Header, Sidebar)

#### 5.2 Pages 이동
- [ ] `src/presentation/pages/` 디렉토리 생성
- [ ] 기존 pages 이동

#### 5.3 UI Hooks 분리
- [ ] `src/presentation/hooks/` 디렉토리 생성
- [ ] UI 관련 Hook 분리
  - `presentation/hooks/useForm.ts`
  - `presentation/hooks/useModal.ts`
  - `presentation/hooks/useToast.ts`

### 테스트
- [ ] 컴포넌트 테스트 보강

---

## Phase 6: State Layer 정리

**브랜치**: `refactor/phase-6-state`

### 목표
전역 상태 관리 정리 (Zustand)

### 작업 항목

#### 6.1 Store 마이그레이션
- [ ] `src/state/` 디렉토리 생성
- [ ] Store 이동 및 정리
  - `state/authStore.ts`
  - `state/uiStore.ts` (선택)

#### 6.2 Selectors
- [ ] 상태 선택자 분리 (필요시)

### 테스트
- [ ] Store 테스트 보강

---

## Phase 7: Front (Next.js) 리팩토링

**브랜치**: `refactor/phase-7-front`

### 목표
Front 앱에도 Clean Architecture 적용

### 작업 항목
- [ ] Next.js App Router 구조에 맞게 조정
- [ ] 공통 타입/유틸 분리
- [ ] 컴포넌트 정리

---

## Phase 8: 문서화 및 정리

**브랜치**: `refactor/phase-8-docs`

### 작업 항목
- [ ] 폴더 구조 README 작성
- [ ] Import alias 설정 (`@core/`, `@data/`, `@domain/`, `@presentation/`)
- [ ] 사용하지 않는 코드 정리
- [ ] 최종 린트 및 타입 체크

---

## 의존성 규칙

```
presentation/ → domain/ → data/ → core/
                  ↘       ↗
                   state/
```

- **Core**: 다른 레이어에 의존하지 않음
- **Data**: Core에만 의존
- **Domain**: Data, Core에만 의존
- **Presentation**: 모든 레이어에 의존 가능
- **State**: Core, Domain에 의존

---

## 작업 순서 권장

1. **Phase 2 (Core)**: 기반 레이어 먼저 생성
2. **Phase 3 (Data)**: API/Repository 정리
3. **Phase 4 (Domain)**: 비즈니스 로직 분리
4. **Phase 5 (Presentation)**: UI 정리
5. **Phase 6 (State)**: 상태 관리 정리
6. **Phase 7 (Front)**: Front 앱 적용
7. **Phase 8 (Docs)**: 마무리

---

**마지막 업데이트**: 2025-12-20
