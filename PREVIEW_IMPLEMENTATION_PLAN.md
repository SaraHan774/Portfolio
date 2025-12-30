# 작품 미리보기 기능 구현 계획 (Option 2: 새 탭에서 프론트엔드 페이지 열기)

## 개요

Admin에서 작품을 편집/작성할 때 실제 프론트엔드 사이트에서 미리보기할 수 있는 기능을 구현합니다.

**전략**: Separate Preview Tokens Collection (Approach C)
- 보안: 시간 제한이 있는 토큰 기반 인증
- 깔끔함: Work 스키마에 미리보기 관련 필드 추가 없음
- 확장성: 토큰 추적, 접근 제어 등 추가 기능 용이

## 아키텍처

```
Admin (localhost:5173)
  ├─ "미리보기" 버튼 클릭
  ├─ 새 작업이면 → 자동 임시저장 (isPublished=false)
  ├─ Preview Token 생성 (24시간 유효)
  └─ 새 탭 열기: localhost:3000/works/preview?token=xxx

Front (localhost:3000)
  ├─ /works/preview?token=xxx 접근
  ├─ Token 유효성 검증 (Firestore /previewTokens 조회)
  ├─ 유효하면 → workId 가져오기
  ├─ /works/[workId]?preview=token으로 리다이렉트
  └─ Work 상세 페이지 (isPublished 체크 우회)
```

## 구현 단계

### STEP 1: 타입 정의 및 상수 추가

#### 1.1 Admin - PreviewToken 타입 추가
**파일**: `/Users/gahee/Portfolio/admin/src/core/types/api.ts`
- Line 132 이후에 `PreviewToken` interface 추가

```typescript
export interface PreviewToken {
  id: string;
  workId: string;
  token: string;
  createdAt: Date;
  expiresAt: Date;
  createdBy?: string;
}
```

#### 1.2 Admin - 환경 변수 추가
**파일**: `/Users/gahee/Portfolio/admin/.env`, `.env.example`
```env
VITE_FRONT_URL=http://localhost:3000
```

#### 1.3 Admin - 상수 추가
**파일**: `/Users/gahee/Portfolio/admin/src/core/constants/api.ts`
```typescript
export const PREVIEW_TOKEN_EXPIRY_HOURS = 24;
export const PREVIEW_TOKENS_COLLECTION = 'previewTokens';
```

#### 1.4 Front - PreviewToken 타입 추가
**파일**: `/Users/gahee/Portfolio/front/src/core/types/index.ts`
- Admin과 동일한 `PreviewToken` interface 추가

#### 1.5 Front - 상수 추가
**파일**: `/Users/gahee/Portfolio/front/src/core/constants/firebase.constants.ts`
```typescript
export const PREVIEW_TOKENS_COLLECTION = 'previewTokens';
```

---

### STEP 2: Admin - Preview Token 생성 로직

#### 2.1 의존성 설치
```bash
cd /Users/gahee/Portfolio/admin
npm install uuid
npm install --save-dev @types/uuid
```

#### 2.2 Preview Token Repository 생성
**파일**: `/Users/gahee/Portfolio/admin/src/data/repository/previewTokenRepository.ts` (새 파일)
- `createPreviewToken(workId, createdBy?)` 함수 구현
- UUID v4로 토큰 생성
- Firestore에 저장 (expiresAt = 현재시각 + 24시간)

#### 2.3 Preview Token Hook 생성
**파일**: `/Users/gahee/Portfolio/admin/src/domain/hooks/usePreviewToken.ts` (새 파일)
- `useCreatePreviewToken()` mutation hook

#### 2.4 WorkForm 수정 - handleDraftSave 반환값 추가
**파일**: `/Users/gahee/Portfolio/admin/src/pages/WorkForm.tsx`
- `handleDraftSave` 함수가 생성된 workId를 반환하도록 수정
- 새 작업 생성 시: mutation 결과에서 ID 추출 후 반환
- 기존 작업 수정 시: 기존 ID 반환

#### 2.5 WorkForm 수정 - handlePreview 구현
**파일**: `/Users/gahee/Portfolio/admin/src/pages/WorkForm.tsx` (Line 330)

**로직**:
1. 제목 유효성 검사
2. 새 작업이면 자동 임시저장 후 workId 획득
3. Preview token 생성
4. Front URL 구성: `${VITE_FRONT_URL}/works/preview?token=xxx`
5. 새 탭으로 열기
6. 성공 메시지 표시

**Import 추가**:
```typescript
import { useCreatePreviewToken } from '../domain/hooks/usePreviewToken';
```

**Component 내부**:
```typescript
const createPreviewTokenMutation = useCreatePreviewToken();
```

---

### STEP 3: Front - Preview Token 검증 및 페이지

#### 3.1 Preview Token API 생성
**파일**: `/Users/gahee/Portfolio/front/src/data/api/previewTokensApi.ts` (새 파일)
- `validatePreviewToken(token): Promise<string | null>` 함수
- Firestore에서 token 조회 (where token == xxx AND expiresAt > now)
- 유효하면 workId 반환, 아니면 null

#### 3.2 Works API 수정 - Preview용 Fetch 추가
**파일**: `/Users/gahee/Portfolio/front/src/data/api/worksApi.ts`
- Line 65 이후에 `fetchWorkByIdForPreview(id)` 함수 추가
- `fetchWorkById`와 동일하지만 `isPublished` 체크 제거

#### 3.3 Work Repository 수정
**파일**: `/Users/gahee/Portfolio/front/src/data/repository/WorkRepository.ts`
- `getWorkByPreviewToken(token)` 메서드 추가
- Token 검증 → workId 획득 → fetchWorkByIdForPreview 호출

#### 3.4 Preview Hook 생성
**파일**: `/Users/gahee/Portfolio/front/src/domain/hooks/useWorkPreview.ts` (새 파일)
- `useWorkPreview(token)` hook
- React Query 사용, staleTime: 0 (항상 최신 데이터)

#### 3.5 Preview 페이지 생성
**파일**: `/Users/gahee/Portfolio/front/app/works/preview/page.tsx` (새 파일)

**로직**:
1. URL에서 token 파라미터 추출
2. `useWorkPreview(token)` 호출
3. 로딩: 스피너 표시
4. 성공: `/works/[workId]?preview=${token}`으로 리다이렉트
5. 실패: 에러 페이지 ("토큰이 만료되었거나 유효하지 않습니다")

#### 3.6 Work Detail 페이지 수정
**파일**: `/Users/gahee/Portfolio/front/app/works/[id]/page.tsx`

**변경사항**:
1. `searchParams.get('preview')` 확인
2. preview 파라미터 있으면 `useWorkPreview(token)` 사용
3. preview 파라미터 없으면 기존 `useWork(id)` 사용
4. Preview 모드 배너 표시 (상단 fixed, 주황색 배경)
   - 텍스트: "미리보기 모드 - 이 작업은 [게시됨/미게시]"

---

### STEP 4: Firebase 설정

#### 4.1 Firestore Security Rules 수정
**파일**: `/Users/gahee/Portfolio/firestore.rules`

Line 32 이후 추가:
```rules
// Preview tokens collection
match /previewTokens/{tokenId} {
  allow read: if true;  // 누구나 읽기 가능 (검증용)
  allow write: if request.auth != null;  // 인증된 사용자만 작성
}
```

#### 4.2 Firestore TTL 설정 (Manual)
Firebase Console에서 수동 설정:
1. Firestore → Collections → `previewTokens`
2. TTL policy 설정: `expiresAt` 필드
3. 만료된 토큰 자동 삭제 활성화

---

## 주요 파일 목록

### Admin 수정/생성 파일
1. `/Users/gahee/Portfolio/admin/src/core/types/api.ts` - PreviewToken 타입 추가
2. `/Users/gahee/Portfolio/admin/src/core/constants/api.ts` - 상수 추가
3. `/Users/gahee/Portfolio/admin/.env` - VITE_FRONT_URL 추가
4. `/Users/gahee/Portfolio/admin/src/data/repository/previewTokenRepository.ts` - 신규
5. `/Users/gahee/Portfolio/admin/src/domain/hooks/usePreviewToken.ts` - 신규
6. `/Users/gahee/Portfolio/admin/src/pages/WorkForm.tsx` - handlePreview 수정

### Front 수정/생성 파일
1. `/Users/gahee/Portfolio/front/src/core/types/index.ts` - PreviewToken 타입 추가
2. `/Users/gahee/Portfolio/front/src/core/constants/firebase.constants.ts` - 상수 추가
3. `/Users/gahee/Portfolio/front/src/data/api/previewTokensApi.ts` - 신규
4. `/Users/gahee/Portfolio/front/src/data/api/worksApi.ts` - fetchWorkByIdForPreview 추가
5. `/Users/gahee/Portfolio/front/src/data/repository/WorkRepository.ts` - getWorkByPreviewToken 추가
6. `/Users/gahee/Portfolio/front/src/domain/hooks/useWorkPreview.ts` - 신규
7. `/Users/gahee/Portfolio/front/app/works/preview/page.tsx` - 신규
8. `/Users/gahee/Portfolio/front/app/works/[id]/page.tsx` - preview 모드 지원

### 설정 파일
1. `/Users/gahee/Portfolio/firestore.rules` - previewTokens 규칙 추가
2. Firebase Console - TTL 설정 (수동)

---

## Edge Cases 처리

### 1. 새 작업 미리보기
- ✅ 자동 임시저장 후 미리보기 (사용자 선택)
- 임시저장 실패 시 에러 메시지 표시

### 2. 토큰 만료
- ✅ 24시간 후 자동 만료 (사용자 선택)
- Front에서 만료된 토큰 접근 시 에러 페이지

### 3. Work 삭제 후 토큰 접근
- Front에서 NotFoundError 처리

### 4. 이미 게시된 작업 미리보기
- 미리보기 가능, 배너에 "이미 게시됨" 표시

### 5. 네트워크 에러
- React Query retry 비활성화 (preview hook)
- 에러 페이지 표시

---

## 보안 체크리스트

- ✅ 토큰은 UUID v4 (128-bit 랜덤)
- ✅ 시간 제한 (24시간)
- ✅ Firestore 규칙으로 write 제한 (auth 필요)
- ✅ 토큰 유효성은 서버(Firestore)에서 검증
- ✅ 비공개 작업은 유효한 토큰 없이 접근 불가

---

## 테스트 시나리오

### Admin 테스트
1. [ ] 기존 작업 편집 → 미리보기 → 새 탭 열림
2. [ ] 새 작업 생성 → 미리보기 → 자동 임시저장 → 새 탭 열림
3. [ ] 제목 없이 미리보기 → 경고 메시지
4. [ ] 토큰 생성 실패 시 에러 메시지

### Front 테스트
1. [ ] 유효한 토큰 → work detail 페이지 리다이렉트
2. [ ] 만료된 토큰 → 에러 페이지
3. [ ] 잘못된 토큰 → 에러 페이지
4. [ ] Preview 모드 배너 표시
5. [ ] 게시된 작업 vs 미게시 작업 배너 텍스트 다름
6. [ ] 비공개 작업을 토큰 없이 직접 URL 접근 → 404

---

## 구현 순서 요약

1. **Admin 타입 & 상수** → env 설정
2. **Admin 토큰 생성 로직** → Repository, Hook
3. **Admin WorkForm 수정** → handlePreview 구현
4. **Front 타입 & 상수**
5. **Front 토큰 검증 API** → previewTokensApi
6. **Front Works API 수정** → fetchWorkByIdForPreview
7. **Front Repository & Hook** → useWorkPreview
8. **Front 페이지** → preview 페이지, detail 페이지 수정
9. **Firestore Rules** → previewTokens 추가
10. **테스트** → 전체 플로우 검증
