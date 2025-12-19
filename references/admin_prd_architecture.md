# 포트폴리오 웹사이트 관리자 페이지 PRD - 시스템 아키텍처

> 이 문서는 [PRD 개요](./admin_prd_overview.md)의 일부입니다.

---

## 🏗 시스템 아키텍처

### 기술 스택 (인터페이스 기반)

```typescript
// 데이터베이스 추상화 인터페이스
interface IDatabase {
  // Users
  createUser(user: User): Promise<User>;
  getUserByGoogleId(googleId: string): Promise<User | null>;

  // Works
  createWork(work: Work): Promise<Work>;
  getWork(id: string): Promise<Work | null>;
  updateWork(id: string, work: Partial<Work>): Promise<Work>;
  deleteWork(id: string): Promise<void>;
  listWorks(filters?: WorkFilters): Promise<Work[]>;

  // Categories
  createSentenceCategory(category: SentenceCategory): Promise<SentenceCategory>;
  updateSentenceCategory(id: string, category: Partial<SentenceCategory>): Promise<SentenceCategory>;
  listSentenceCategories(): Promise<SentenceCategory[]>;

  createExhibitionCategory(category: ExhibitionCategory): Promise<ExhibitionCategory>;
  updateExhibitionCategory(id: string, category: Partial<ExhibitionCategory>): Promise<ExhibitionCategory>;
  listExhibitionCategories(): Promise<ExhibitionCategory[]>;

  // Work Orders
  updateWorkOrders(categoryId: string, orders: WorkOrder[]): Promise<void>;
}

// 문장형 카테고리: 문장 내 키워드를 개별 클릭
interface SentenceCategory {
  id: string;
  sentence: string;           // 전체 문장 (예: "물은 아름다운 불과 같다")
  keywords: Keyword[];        // 클릭 가능한 키워드들
  order: number;              // 표시 순서
}

interface Keyword {
  id: string;
  text: string;               // 키워드 텍스트 (예: "물")
  startIndex: number;         // 문장 내 시작 위치
  endIndex: number;           // 문장 내 끝 위치
  workIds: string[];          // 연결된 작업 ID들
}

// 전시명 카테고리: 통으로 클릭 (작업명 + 간단 설명)
interface ExhibitionCategory {
  id: string;
  title: string;              // 작업명 (예: "Cushioning Attack")
  description: {              // 간단 설명 (구조화된 형태)
    exhibitionType: string;   // 전시 유형 (예: "2인전", "개인전", "그룹전")
    venue: string;            // 공간 (예: "YPCSpace")
    year: number;             // 년도 (예: 2023)
  };
  order: number;              // 표시 순서
  workIds: string[];          // 연결된 작업 ID들
}

// 영상 (YouTube Embed)
interface WorkVideo {
  id: string;
  youtubeUrl: string;          // YouTube 원본 URL (예: https://www.youtube.com/watch?v=xxx)
  youtubeVideoId: string;      // YouTube 영상 ID (예: xxx)
  embedUrl: string;            // Embed URL (예: https://www.youtube.com/embed/xxx)
  title?: string;              // 영상 제목 (선택)
  order: number;               // 미디어 순서 (이미지와 함께 정렬)
}

// 미디어 아이템 (이미지 또는 영상)
type MediaItem =
  | { type: 'image'; data: WorkImage }
  | { type: 'video'; data: WorkVideo };

// 파일 저장소 추상화 인터페이스
interface IStorage {
  uploadImage(file: File, path: string): Promise<UploadResult>;
  deleteImage(url: string): Promise<void>;
  getImageUrl(path: string, options?: ImageOptions): string;
  generateThumbnail(url: string, size: { width: number; height: number }): Promise<string>;
}

interface ImageOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

interface UploadResult {
  url: string;
  thumbnailUrl?: string;
  width: number;
  height: number;
}
```

### 프론트엔드 (관리자 페이지)
- **Framework**: React 18 + TypeScript
- **UI Library**: **Ant Design 5.x** (antd)
  - 관리자 페이지에 최적화된 컴포넌트 세트
  - Form, Table, Upload, Modal 등 모두 포함
  - 한국어 지원, 테마 커스터마이징 가능
- **State Management**:
  - React Query (서버 상태)
  - Zustand (클라이언트 상태)
- **Form Management**: Ant Design Form (내장)
- **Rich Text Editor**:
  - Tiptap 2.x (추천) 또는
  - Quill (더 쉬움)
- **Drag & Drop**:
  - @dnd-kit/core + @dnd-kit/sortable
  - react-beautiful-dnd (더 쉬움, Ant Design과 잘 맞음)
- **Image Upload**:
  - Ant Design Upload 컴포넌트 (내장)
  - react-dropzone (추가 기능 필요 시)
- **Routing**: React Router v6
- **Icons**: @ant-design/icons (내장)

---

## 📱 화면 구조

### 전체 레이아웃

```
┌─────────────────────────────────────────────────────────┐
│  [로고] Portfolio Admin    [프로필] [로그아웃]           │
├───────────┬─────────────────────────────────────────────┤
│           │                                             │
│  📊 대시보드 │                                             │
│  🎨 작업관리 │          메인 컨텐츠 영역                   │
│  📁 카테고리 │                                             │
│  ⚙️ 설정    │                                             │
│           │                                             │
└───────────┴─────────────────────────────────────────────┘
```

### 주요 화면 목록

1. **로그인 화면** (Login)
2. **대시보드** (Dashboard)
3. **작업 목록** (Works List)
4. **작업 생성/수정** (Work Form)
5. **카테고리 관리** (Categories)
   - 문장형 카테고리 (키워드 개별 클릭)
   - 전시명 카테고리 (통으로 클릭)
6. **설정** (Settings)

> 각 화면의 상세 기획은 [화면별 상세 기획](./admin_prd_screens.md) 문서를 참고하세요.

---

## 🔐 인증 서비스

```typescript
interface AuthService {
  loginWithGoogle(): Promise<User>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
}
```

### 인증/인가
- Google OAuth 로그인만 허용
- JWT 토큰 방식
- 토큰 만료: 7일
- Refresh token 사용

---

## 📊 상태 관리

### 작업 목록 상태
```typescript
interface WorkListState {
  works: Work[];
  filters: {
    status?: 'published' | 'draft';
    categories?: string[];
    searchQuery?: string;
  };
  selectedWorks: string[];
  sortBy: 'latest' | 'oldest' | 'title';
  page: number;
  pageSize: number;
}
```

### Form Validation
```typescript
interface WorkFormValidation {
  title: {
    required: "제목을 입력해주세요";
    maxLength: { value: 100, message: "제목은 100자 이하로 입력해주세요" };
  };
  fullDescription: {
    required: "상세 설명을 입력해주세요";
    maxLength: { value: 5000, message: "설명은 5000자 이하로 입력해주세요" };
  };
  images: {
    required: "최소 1장의 이미지를 업로드해주세요";
    validate: (images: WorkImage[]) => {
      if (!images.some(img => img.isThumbnail)) {
        return "대표 썸네일을 선택해주세요";
      }
      return true;
    };
  };
}
```

---

## 🖼 이미지 업로드 설정

```typescript
interface ImageUploadProps {
  maxFiles: 50;
  maxFileSize: 10 * 1024 * 1024; // 10MB
  accept: ['image/jpeg', 'image/png', 'image/webp'];
  multiple: true;
  onDrop: (files: File[]) => void;
}
```

### 업로드 프로세스
```
1. 파일 선택/드롭
   ↓
2. 클라이언트 측 검증
   - 파일 형식 체크
   - 파일 크기 체크
   - 최대 개수 체크
   ↓
3. 프리뷰 생성 (로컬)
   ↓
4. 서버 업로드
   - 진행률 표시
   - 썸네일 자동 생성 (1:1)
   ↓
5. 완료
   - 이미지 목록에 추가
   - 순서는 업로드 순서
```

---

## 🎬 YouTube URL 처리

### 지원 URL 형식
```typescript
// 지원되는 URL 형식
const YOUTUBE_URL_PATTERNS = [
  'https://www.youtube.com/watch?v={videoId}',
  'https://youtu.be/{videoId}',
  'https://www.youtube.com/embed/{videoId}',
  'https://youtube.com/watch?v={videoId}'
];
```

### URL 파싱
```typescript
function parseYoutubeUrl(url: string): {
  videoId: string;
  embedUrl: string;
} | null {
  // URL에서 videoId 추출
  // embedUrl 생성: https://www.youtube.com/embed/{videoId}
}
```