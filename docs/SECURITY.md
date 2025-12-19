# SECURITY.md: 보안 가이드

## 1. 인증 및 토큰 관리

### 1.1 토큰 저장 방식

```typescript
// ❌ 나쁜 예: localStorage (XSS 취약)
localStorage.setItem('token', authToken);
// XSS 공격 시 JavaScript로 쉽게 탈취 가능

// ✅ 최선: HttpOnly 쿠키 (서버에서 설정)
// Set-Cookie: authToken=...; HttpOnly; Secure; SameSite=Strict; Path=/api

// 클라이언트는 쿠키가 자동으로 포함됨
const response = await fetch('/api/protected', {
  credentials: 'include', // 쿠키 포함
});

// ✅ 대안: 메모리 저장 (페이지 새로고침 시 초기화)
const tokenStore = {
  token: null as string | null,

  setToken(newToken: string) {
    this.token = newToken;
  },

  getToken(): string | null {
    return this.token;
  },

  clearToken() {
    this.token = null;
  },
};

// 요청 인터셉터에서 헤더에 포함
apiClient.interceptors.request.use((config) => {
  const token = tokenStore.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### 1.2 토큰 갱신 (Refresh Token)

```typescript
// ✅ Access Token (짧은 유효기간) + Refresh Token
const apiClient = axios.create({
  baseURL: process.env.VITE_API_URL,
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token?: string) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== '/auth/refresh'
    ) {
      if (isRefreshing) {
        // 이미 갱신 중이면 대기
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Refresh Token으로 새 Access Token 획득
        const { data } = await axios.post(
          `${process.env.VITE_API_URL}/auth/refresh`,
          {},
          {
            withCredentials: true, // Refresh Token 쿠키 포함
          }
        );

        const { accessToken } = data;
        tokenStore.setToken(accessToken);

        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        return apiClient(originalRequest);
      } catch (err) {
        processQueue(err);
        tokenStore.clearToken();
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
```

## 2. XSS (Cross-Site Scripting) 방지

### 2.1 HTML 자동 이스케이핑

```typescript
// ❌ 나쁜 예: HTML 인젝션 취약
function CommentItem({ text }: { text: string }) {
  return <div dangerouslySetInnerHTML={{ __html: text }} />;
}

// ✅ 좋은 예: 자동 이스케이핑
function CommentItem({ text }: { text: string }) {
  return <div>{text}</div>; // React가 자동으로 이스케이프
}

// 사용자 입력
const userInput = '<img src="x" onerror="alert(\'XSS\')" />';
// 렌더링: &lt;img src="x" onerror="alert('XSS')" /&gt;
```

### 2.2 마크다운 안전하게 렌더링

```typescript
import DOMPurify from 'dompurify';
import { marked } from 'marked';

// ✅ HTML 정제 후 렌더링
function MarkdownContent({ text }: { text: string }) {
  const html = marked(text);
  const clean = DOMPurify.sanitize(html);
  return <div dangerouslySetInnerHTML={{ __html: clean }} />;
}

// DOMPurify 설정
DOMPurify.setConfig({
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'code', 'pre'],
  ALLOWED_ATTR: ['href'],
});
```

### 2.3 URL 검증

```typescript
// ✅ 신뢰할 수 있는 URL만 링크로 사용
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function SafeLink({ href, children }: any) {
  if (!isValidUrl(href)) {
    return <span>{children}</span>;
  }
  return <a href={href}>{children}</a>;
}

// 사용
<SafeLink href="https://example.com">Click</SafeLink>
<SafeLink href="javascript:alert('xss')">Click</SafeLink> {/* 무시됨 */}
```

## 3. CSRF (Cross-Site Request Forgery) 방지

### 3.1 CSRF 토큰

```typescript
// ✅ 서버에서 CSRF 토큰 발급
// 응답 헤더: X-CSRF-Token: abc123xyz

// 클라이언트: 모든 요청에 토큰 포함
apiClient.interceptors.request.use((config) => {
  const token = document
    .querySelector('meta[name="csrf-token"]')
    ?.getAttribute('content');

  if (token) {
    config.headers['X-CSRF-Token'] = token;
  }

  return config;
});

// 서버: POST/PUT/DELETE 요청 시 토큰 검증
// if (req.header('X-CSRF-Token') !== req.session.csrfToken) {
//   return res.status(403).send('CSRF token mismatch');
// }
```

### 3.2 SameSite 쿠키

```html
<!-- HTML: 메타 태그로 정책 설정 -->
<meta http-equiv="Content-Security-Policy" content="...">

<!-- 서버: 응답 헤더 -->
Set-Cookie: session=xyz; SameSite=Strict; Secure; HttpOnly
```

**SameSite 값**:
- `Strict`: 같은 사이트 요청만 (가장 안전)
- `Lax`: 같은 사이트 + 안전한 크로스사이트 요청 (기본값)
- `None`: 모든 크로스사이트 요청 (Secure 필수)

## 4. 환경 변수 관리

### 4.1 공개 vs 비공개

```typescript
// ✅ 공개 정보만 클라이언트에
// .env
VITE_API_URL=https://api.example.com
VITE_ENV=production

// ❌ 이런 것은 절대 노출하면 안 됨
// VITE_DATABASE_URL=... (데이터베이스 접근)
// VITE_API_SECRET=... (API 키)
// VITE_ADMIN_PASSWORD=... (비밀번호)

// 이런 정보는 서버에서만 관리
// .env (서버)
DATABASE_URL=...
API_SECRET=...
```

### 4.2 Vite 환경변수 접근

```typescript
// ✅ import.meta.env로 접근
const apiUrl = import.meta.env.VITE_API_URL;
const env = import.meta.env.VITE_ENV;

// ❌ process.env는 Node.js용 (브라우저에서 사용 불가)
const wrong = process.env.VITE_API_URL; // undefined
```

## 5. 민감 데이터 처리

### 5.1 로깅 제외

```typescript
// ❌ 나쁜 예: 토큰을 로그에 기록
console.log('Response:', response); // 토큰 포함

// ✅ 좋은 예: 민감 데이터 제외
function safeLog(obj: any, blacklist = ['token', 'password', 'secret']) {
  const sanitized = { ...obj };
  blacklist.forEach(key => {
    if (key in sanitized) delete sanitized[key];
  });
  console.log('Response:', sanitized);
}

safeLog(response); // token 제거됨
```

### 5.2 응답 캐싱 금지

```typescript
// ✅ 민감 데이터는 캐싱하지 않음
const sensitiveQueryOptions = {
  staleTime: 0,
  gcTime: 0,
};

// 사용자 비밀번호 변경 폼
const useChangePassword = () => {
  return useQuery({
    queryKey: ['user', 'password'],
    queryFn: fetchPasswordPolicy,
    ...sensitiveQueryOptions,
  });
};
```

### 5.3 브라우저 자동완성 방지

```html
<!-- 민감한 입력 필드 -->
<input type="password" autocomplete="off" />
<input type="text" name="credit_card" autocomplete="off" />
```

## 6. 권한 제어 (Authorization)

### 6.1 Protected Routes

```typescript
// ✅ 인증/권한 필요 여부 확인
interface ProtectedRouteProps {
  component: React.ComponentType;
  requiredAuth?: boolean;
  requiredRoles?: string[];
}

function ProtectedRoute({
  component: Component,
  requiredAuth = true,
  requiredRoles,
}: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth();
  const isAuthorized = !requiredRoles ||
    requiredRoles.some(role => user?.roles.includes(role));

  if (requiredAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAuthorized) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Component />;
}

// 라우트 설정
<Routes>
  <Route path="/admin" element={
    <ProtectedRoute
      component={AdminPanel}
      requiredRoles={['admin']}
    />
  } />
  <Route path="/user" element={
    <ProtectedRoute component={UserDashboard} />
  } />
</Routes>
```

### 6.2 API 수준 권한 확인

```typescript
// ✅ Repository에서 권한 확인
const userRepository = {
  async update(userId: string, updates: Partial<User>) {
    // 현재 사용자가 권한이 있는지 확인
    const currentUser = getCurrentUser();
    if (currentUser.id !== userId && !currentUser.roles.includes('admin')) {
      throw new ForbiddenError('Insufficient permissions');
    }

    return apiClient.put(`/users/${userId}`, updates);
  },
};

// 응답 처리
async function handleUpdateUser(userId: string, updates: Partial<User>) {
  try {
    await userRepository.update(userId, updates);
  } catch (error) {
    if (error instanceof ForbiddenError) {
      showNotification('You do not have permission to perform this action');
    }
  }
}
```

## 7. 의존성 보안

### 7.1 취약점 스캔

```bash
# 의존성의 알려진 취약점 확인
npm audit

# 높은 수준의 취약점만 표시
npm audit --audit-level=high

# 자동으로 수정 가능한 것 수정
npm audit fix

# 자세한 보고서 생성
npm audit --json > audit-report.json
```

### 7.2 신뢰할 수 있는 패키지만 사용

```typescript
// ❌ 불명확한 패키지
npm install unknown-package

// ✅ 신뢰할 수 있는 패키지 확인
// 1. npm 통계 확인 (다운로드, 유지보수 상태)
// 2. GitHub 저장소 확인 (별, 이슈, 마지막 업데이트)
// 3. 커뮤니티 평판 확인

// package.json에 신뢰할 수 있는 패키지만
"dependencies": {
  "react": "^18.2.0",
  "axios": "^1.6.0",
  "@tanstack/react-query": "^5.0.0"
}
```

### 7.3 의존성 잠금

```bash
# package-lock.json 또는 yarn.lock 커밋
# 동료 개발자와 정확히 같은 버전 사용 보장

# CI/CD에서 정확한 버전 설치
npm ci  # npm install 대신
```

## 8. 콘텐츠 보안 정책 (CSP)

### 8.1 CSP 헤더 설정

```html
<!-- public/index.html 또는 서버 헤더 -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' cdn.example.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self';
  connect-src 'self' https://api.example.com;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
">
```

**지시어 설명**:
- `default-src`: 기본 정책
- `script-src`: 스크립트 로드 출처
- `style-src`: 스타일 로드 출처
- `img-src`: 이미지 로드 출처
- `connect-src`: API/WebSocket 출처
- `frame-ancestors`: 외부 페이지에서 iframe 포함 차단

## 보안 체크리스트

프로젝트 시작 전 확인:

- [ ] **토큰**: HttpOnly 쿠키 또는 메모리 저장
- [ ] **XSS**: dangerouslySetInnerHTML 최소화, DOMPurify 사용
- [ ] **CSRF**: CSRF 토큰 또는 SameSite 쿠키
- [ ] **환경변수**: 공개 정보만 클라이언트에 노출
- [ ] **로깅**: 토큰/비밀번호 제외
- [ ] **권한**: Protected Routes, API 수준 확인
- [ ] **의존성**: `npm audit` 정기 실행
- [ ] **CSP**: 헤더 설정, 인라인 스크립트 최소화
- [ ] **HTTPS**: 프로덕션은 HTTPS 필수
- [ ] **쿠키**: Secure, HttpOnly, SameSite 설정

---

**더 보기**: `docs/TESTING.md`
