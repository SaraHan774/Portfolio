# 포트폴리오 웹사이트 관리자 페이지 PRD - 기술 요구사항

> 이 문서는 [PRD 개요](./admin_prd_overview.md)의 일부입니다.

---

## 🔒 보안 고려사항

### 인증/인가

- Google OAuth 로그인만 허용
- JWT 토큰 방식
- 토큰 만료: 7일
- Refresh token 사용

### 파일 업로드 보안

```typescript
// 클라이언트 측 검증
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// 서버 측 검증
- MIME type 재확인
- 파일 확장자 검증
- 이미지 실제 내용 검증 (magic bytes)
- 바이러스 스캔 (선택)
```

### XSS 방지

- 캡션 HTML sanitization
- DOMPurify 라이브러리 사용
- 허용 태그: `<a>`, `<strong>`, `<em>`, `<u>`
- 허용 속성: `href`, `data-work-id`

### CSRF 방지

- CSRF 토큰 자동 포함
- SameSite Cookie 설정

---

## 📊 성능 요구사항

### 로딩 시간

- 페이지 초기 로딩: < 2초
- **작업 목록 렌더링: < 1초** (100개 작업 기준)
- 이미지 업로드 (10MB): < 5초
- 카테고리별 필터링: < 500ms

### 작업 목록 성능 최적화 (핵심!)

작업 목록은 사용자가 가장 자주 접근하는 화면이므로 최우선 최적화 대상

#### 1. 가상 스크롤 (Virtual Scrolling)
- **목적**: 100개 이상 작업이 있어도 빠른 렌더링
- **방법**:
  - react-window 또는 Ant Design Table의 virtual scroll 활용
  - 화면에 보이는 10-20개만 실제 렌더링
  - 스크롤 시 동적으로 렌더링
- **효과**: 1000개 작업도 초기 렌더링 1초 이내

#### 2. 이미지 최적화
- **썸네일 사이즈**: 최대 100x100px (실제 표시 크기)
- **Lazy Loading**:
  - 화면에 보이는 썸네일만 로드
  - IntersectionObserver 활용
  - Ant Design Image 컴포넌트의 lazy 속성 사용
- **WebP 포맷**: 브라우저 지원 시 WebP 우선 로드
- **Placeholder**:
  - 로딩 중 skeleton 표시
  - 에러 시 fallback 이미지

#### 3. 데이터 페치 최적화
- **Pagination**:
  - 기본 20개씩 로드
  - 무한 스크롤 또는 페이지네이션
- **캐싱**:
  - React Query로 5분간 캐싱
  - 이미 본 페이지는 즉시 표시
- **Prefetching**:
  - 다음 페이지 미리 로드
  - 마우스 호버 시 상세 정보 prefetch

#### 4. 메모이제이션
```typescript
// 컴포넌트 메모이제이션
const WorkCard = React.memo(({ work }) => {
  // 작업 카드 렌더링
});

// 무거운 계산 캐싱
const filteredWorks = useMemo(() => {
  return works.filter(work => matchesFilter(work));
}, [works, filterCriteria]);
```

#### 5. 렌더링 최적화
- **Debouncing**: 검색 입력 500ms 디바운스
- **Throttling**: 스크롤 이벤트 16ms (60fps) 쓰로틀
- **Code Splitting**:
  - 작업 폼은 lazy import
  - 카테고리 관리는 lazy import
- **Bundle Size**:
  - 작업 목록 페이지 JS < 200KB (gzipped)
  - Tree shaking으로 불필요한 코드 제거

#### 6. 상태 관리 최적화
- **지역 상태 우선**:
  - 체크박스 선택은 지역 상태
  - 전역 상태는 최소화
- **선택적 리렌더링**:
  - 한 작업의 상태 변경이 다른 작업에 영향 없도록
  - Context 분리 (auth, works, ui)

#### 7. 네트워크 최적화
- **GraphQL 또는 필드 선택**:
  - 목록에서는 필요한 필드만 (id, title, thumbnail, status)
  - 상세 정보는 클릭 시 로드
- **압축**: gzip 또는 brotli 압축
- **CDN**: 썸네일 이미지는 CDN에서 제공
- **HTTP/2**: 다중 연결로 병렬 로드

#### 8. 모바일 최적화
- **터치 반응**: 터치 이벤트 16ms 이내 반응
- **이미지 해상도**:
  - 모바일은 작은 해상도 썸네일 (50x50px)
  - Retina 디스플레이 대응 (2x)
- **오프라인 대응**:
  - Service Worker로 목록 캐싱
  - 네트워크 없어도 마지막 상태 표시

### 성능 측정 지표

#### Core Web Vitals
- **LCP (Largest Contentful Paint)**: < 2.5초
  - 작업 목록의 첫 카드가 표시되는 시간
- **FID (First Input Delay)**: < 100ms
  - 검색창 클릭 후 반응 시간
- **CLS (Cumulative Layout Shift)**: < 0.1
  - 이미지 로드로 인한 레이아웃 변경 최소화

#### 커스텀 메트릭
- **TTI (Time to Interactive)**: < 3초
- **작업 목록 렌더링 시간**: < 1초 (100개 기준)
- **검색 결과 표시**: < 500ms
- **필터 적용**: < 300ms
- **페이지 전환**: < 200ms

### 성능 모니터링
- **Lighthouse CI**: 매 배포마다 자동 측정
- **Real User Monitoring (RUM)**:
  - 실제 사용자 환경에서 성능 측정
  - 느린 네트워크 사용자 파악
- **Performance Budget**:
  - JS Bundle: < 300KB (gzipped)
  - CSS: < 50KB (gzipped)
  - 이미지 (페이지당): < 500KB

### 이미지 최적화

```typescript
// 업로드 시 자동 처리
1. 원본 저장 (고해상도)
2. 썸네일 생성 (300x300, 1:1, WebP 80%)
3. 목록용 초소형 썸네일 (100x100, WebP 70%)
4. 중간 크기 생성 (1200px 너비, WebP 85%)
```

### 캐싱 전략

- **이미지**:
  - CDN 캐싱 (30일)
  - 브라우저 캐싱 (7일)
- **API 응답**:
  - React Query 캐싱 (5분)
  - 작업 목록: staleTime 5분
  - 작업 상세: staleTime 10분
- **정적 자산**:
  - 브라우저 캐싱 (1년)
  - 파일명에 hash 포함

---

## 🧪 테스트 계획

### 단위 테스트

- 유틸리티 함수
- 커스텀 훅
- API 클라이언트

### 통합 테스트

- 로그인 플로우
- 작업 생성/수정 플로우
- 이미지 업로드 플로우

### E2E 테스트 (Playwright)

**주요 시나리오**:
1. 로그인 → 작업 생성 → 저장 → 확인
2. 이미지 업로드 → 순서 변경 → 썸네일 선택
3. 카테고리 생성 → 작업 연결 → 순서 조정

### 사용자 테스트

**테스트 대상**: 실제 미대생 3-5명

**테스트 시나리오**:
1. "작품 5개를 업로드하고 카테고리를 지정해주세요" (데스크탑)
2. "작품 순서를 바꿔주세요" (데스크탑)
3. "캡션에 다른 작품 링크를 추가해주세요" (데스크탑)
4. 🆕 **"모바일로 작품 1개를 업로드해주세요"** (모바일)
5. 🆕 **"모바일에서 작품 공개 상태를 변경해주세요"** (모바일)

**성공 기준**:
- 80% 이상이 도움 없이 완료
- 평균 완료 시간:
  - 데스크탑 작업: < 15분
  - 모바일 작업: < 5분
- 사용자 만족도 4/5 이상
- 🆕 **모바일 사용성 만족도 4/5 이상**

---

## 📱 접근성 (Accessibility)

### WCAG 2.1 Level AA 준수

- 키보드로만 모든 기능 사용 가능
- 스크린 리더 지원
- 충분한 색상 대비 (최소 4.5:1)
- 포커스 인디케이터 명확
- Alt 텍스트 자동 생성 (이미지 파일명 기반)

### 키보드 단축키

```
Ctrl/Cmd + S: 저장
Ctrl/Cmd + Shift + S: 임시저장
Ctrl/Cmd + P: 미리보기
Esc: 모달 닫기
```

---

## 🚀 배포 계획

### 환경

- Development: 로컬 개발 환경
- Staging: 테스트 서버 (실제 데이터 복사본)
- Production: 실제 서비스

### CI/CD

```
코드 푸시 (GitHub)
   ↓
자동 테스트 실행
   ↓
테스트 통과
   ↓
Staging 배포
   ↓
수동 확인
   ↓
Production 배포
```

### 모니터링

- 에러 추적: Sentry
- 사용자 행동 분석: Google Analytics
- 성능 모니터링: Lighthouse CI
- 업타임 모니터링: UptimeRobot

---

## 💬 지원 및 문의

### 사용자 지원

- 이메일: support@portfolio.com
- 채팅: 관리자 페이지 우측 하단
- 도움말: 각 화면 ? 아이콘

### 개발자 문서

- API 문서: /docs/api
- 컴포넌트 스토리북: /storybook
- 아키텍처 다이어그램: /docs/architecture

---

## ✅ 체크리스트

### 개발 시작 전

- [ ] 데이터베이스 선택 (Firebase / Supabase)
- [ ] 도메인 등록
- [ ] 디자인 시스템 확정
- [ ] 개발 환경 셋업
- [ ] Git 레포지토리 생성

### Phase 1 완료 기준

- [ ] 로그인 가능
- [ ] 작업 10개 업로드 가능
- [ ] 이미지 드래그 앤 드롭 동작
- [ ] 대표 썸네일 선택 가능
- [ ] 공개/비공개 토글 가능
- [ ] **모바일 반응형 동작 확인**
  - [ ] 모바일에서 로그인 가능
  - [ ] 모바일에서 작업 생성 가능
  - [ ] 모바일 카메라로 직접 촬영 및 업로드 가능
  - [ ] 터치 인터랙션 정상 동작
  - [ ] 세로/가로 모드 모두 정상 표시

### Phase 2 완료 기준

- [ ] 카테고리 5개 생성 가능
- [ ] 문장형 카테고리 키워드 선택 가능
- [ ] 작업-카테고리 연결 가능
- [ ] 카테고리별 순서 조정 가능
- [ ] 캡션에 작업 링크 추가 가능
- [ ] 미리보기 동작 확인

### Phase 3 완료 기준

- [ ] 일괄 작업 동작
- [ ] 필터/검색 동작
- [ ] 자동 저장 동작
- [ ] 사용자 테스트 통과
- [ ] 성능 기준 충족
- [ ] 접근성 검사 통과
