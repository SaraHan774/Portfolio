# SECURITY.md: 보안 가이드

---

## 1. 인증 구조

### front (공개 포트폴리오)

인증 없음. Firestore 읽기는 보안 규칙으로만 제어합니다.
`client.ts`에 Firebase Auth를 초기화하지 않습니다.

### admin (관리자 대시보드)

Firebase Auth + Google OAuth. Zustand `authStore`로 상태 관리.

```typescript
// state/authStore.ts
interface AuthStore {
  user: FirebaseUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}
```

**보호 라우트**: `useRequireAdmin` Hook으로 관리자 권한 강제.

```typescript
// domain/hooks/useRequireAdmin.ts
export function useRequireAdmin() {
  const isAdmin = useIsAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin) navigate('/login', { replace: true });
  }, [isAdmin]);
}
```

---

## 2. Firestore 보안 규칙

실제 접근 제어는 클라이언트 코드가 아닌 `firestore.rules`에서 이루어집니다.

```javascript
// firestore.rules (현재 설정)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // works, sentenceCategories, exhibitionCategories, settings
    // → 누구나 읽기 가능 (공개 포트폴리오)
    // → 인증된 사용자만 쓰기 가능 (admin)
    match /works/{workId} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // users → 본인만 읽기/쓰기
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

**중요**: 클라이언트에서 권한 체크만으로는 부족합니다. 규칙 수정은 `firestore.rules`에서 해야 합니다.

---

## 3. XSS 방지

### 3.1 React 자동 이스케이핑

React JSX는 기본적으로 HTML을 이스케이프합니다. `{text}` 렌더링은 안전합니다.

### 3.2 TipTap 리치 텍스트 (admin)

TipTap으로 HTML을 생성하므로 저장/렌더링 시 DOMPurify 적용 필수.

```typescript
import DOMPurify from 'dompurify';

// 저장 전 정제
const cleanHtml = DOMPurify.sanitize(editor.getHTML(), {
  ALLOWED_TAGS: ['p', 'b', 'i', 'em', 'strong', 'a', 'br', 'ul', 'ol', 'li'],
  ALLOWED_ATTR: ['href', 'target'],
});

// front에서 렌더링
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(work.description) }} />
```

`dangerouslySetInnerHTML` 사용 시 항상 DOMPurify 통과 후 사용.

---

## 4. 환경 변수

두 앱의 환경 변수 prefix가 다릅니다.

| 앱 | Prefix | 예시 |
|----|--------|------|
| front (Next.js) | `NEXT_PUBLIC_` | `NEXT_PUBLIC_FIREBASE_API_KEY` |
| admin (Vite) | `VITE_` | `VITE_FIREBASE_API_KEY` |

```bash
# ✅ 공개해도 되는 것만 클라이언트에 노출
NEXT_PUBLIC_FIREBASE_PROJECT_ID=portfolio-nhb
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false

# ❌ 절대 클라이언트에 노출 금지
# Firebase Admin SDK 키, 서비스 계정 JSON, DB URL
```

Firebase 클라이언트 SDK 키(`apiKey`, `authDomain` 등)는 공개되어도 괜찮습니다. 접근 제어는 Firestore 규칙이 담당합니다.

---

## 5. 민감 데이터 처리

### 5.1 로깅 금지 항목

```typescript
// ❌ 절대 로깅하지 않음
console.log(user.email);
console.log(idToken);

// ✅ 안전한 로깅
import { logger } from '@/core/utils/logger';
logger.info('작품 저장 완료', { workId: work.id });
```

### 5.2 에러 메시지

사용자에게 Firebase 내부 오류 코드를 그대로 노출하지 않습니다.

```typescript
// core/utils/errorMessages.ts
export function getAuthErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    'auth/user-not-found': '등록되지 않은 이메일입니다.',
    'auth/wrong-password': '비밀번호가 올바르지 않습니다.',
    'auth/too-many-requests': '너무 많은 시도. 잠시 후 다시 시도해주세요.',
  };
  return messages[code] ?? '오류가 발생했습니다. 다시 시도해주세요.';
}
```

---

## 6. Storage 보안

```javascript
// storage.rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // 누구나 읽기 (공개 포트폴리오 이미지)
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;  // admin만 쓰기
    }
  }
}
```

---

## 7. 의존성 보안

```bash
# 취약점 스캔 (각 앱 디렉토리에서)
cd front && npm audit
cd admin && npm audit

# 자동 수정
npm audit fix
```

---

## 보안 체크리스트

- [ ] `firestore.rules`, `storage.rules` 에서 권한 제어 확인
- [ ] `dangerouslySetInnerHTML` 사용 시 DOMPurify 적용
- [ ] 환경 변수에 민감 정보 미포함 (Admin SDK 키 등)
- [ ] Firebase Auth 토큰은 Firebase SDK가 자동 관리 (직접 저장 금지)
- [ ] 에러 메시지에 내부 코드 미노출
- [ ] `console.log`에 이메일/토큰 미포함
- [ ] `npm audit` 정기 실행
- [ ] Emulator 환경에서만 emulator 연결 플래그 사용

---

**더 보기**: `docs/TESTING.md`
