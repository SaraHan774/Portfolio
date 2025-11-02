# 포트폴리오 웹사이트 데이터 구조

## 개요
작업(Work) 중심의 포트폴리오 사이트로, 문장형 카테고리와 텍스트형 카테고리를 통해 작업을 분류하고 표시합니다.

### 핵심 설계 원칙
- **성능 우선**: 100개 이상의 작업도 빠른 렌더링 (< 1초)
- **완전 반응형**: 데스크탑과 모바일에서 동일한 기능 제공
- **확장 가능**: 데이터베이스 추상화로 Firebase/Supabase 선택 가능
- **SEO 친화적**: 메타데이터와 구조화된 데이터 지원

### 기술 스택
- **Frontend**: React 18 + TypeScript + Ant Design 5.x
- **Database**: Firebase 또는 Supabase (인터페이스로 추상화)
- **Image Storage**: Firebase Storage 또는 Supabase Storage
- **State Management**: React Query + Zustand
- **Build Tool**: Vite 또는 Next.js (SSR/SSG 선택 가능)

---

## 1. User (관리자)

```typescript
interface User {
  id: string;
  email: string;
  googleId: string;
  displayName: string;
  profileImage?: string;
  role: 'admin' | 'viewer';
  createdAt: Date;
  lastLoginAt: Date;
}
```

### 설명
- Google OAuth를 통한 로그인
- 현재는 관리자 1명이지만, 향후 확장 가능하도록 role 필드 포함
- `admin`: 모든 권한 (작업/카테고리 CRUD)
- `viewer`: 읽기 전용 (향후 확장용)

---

## 2. SentenceCategory (문장형 카테고리)

```typescript
interface SentenceCategory {
  id: string;
  sentence: string;  // 전체 문장: "물은 아름다운 불과 같다"
  keywords: KeywordCategory[];  // 선택 가능한 단어들
  displayOrder: number;  // 좌측 세로 배치 순서
  isActive: boolean;  // 활성화 여부
  createdAt: Date;
  updatedAt: Date;
}

interface KeywordCategory {
  id: string;
  name: string;  // "물", "아름다운", "불"
  startIndex: number;  // 문장 내 시작 위치
  endIndex: number;  // 문장 내 끝 위치
  workOrders: WorkOrder[];  // 이 키워드 카테고리에 속한 작업들의 순서
}

interface WorkOrder {
  workId: string;
  order: number;  // 이 카테고리 내에서의 순서
}
```

### 설명
- 하나의 문장(`sentence`)에 여러 키워드(`keywords`)가 포함
- 각 키워드는 독립적인 카테고리로 동작
- `startIndex`, `endIndex`로 문장 내 위치 파악 (hover/bold 처리용)
- 클릭 시 상단에 점(.) 표시는 프론트엔드에서 처리
- 각 키워드마다 작업 순서를 별도로 관리 (`workOrders`)

### 예시
```json
{
  "id": "sent-001",
  "sentence": "물은 아름다운 불과 같다",
  "keywords": [
    {
      "id": "key-001",
      "name": "물",
      "startIndex": 0,
      "endIndex": 1,
      "workOrders": [
        { "workId": "work-001", "order": 1 },
        { "workId": "work-003", "order": 2 }
      ]
    },
    {
      "id": "key-002",
      "name": "아름다운",
      "startIndex": 3,
      "endIndex": 7,
      "workOrders": [
        { "workId": "work-002", "order": 1 }
      ]
    }
  ],
  "displayOrder": 1,
  "isActive": true
}
```

---

## 3. TextCategory (텍스트형 카테고리)

```typescript
interface TextCategory {
  id: string;
  name: string;  // "디자인", "개발", "일러스트" 또는 일반 문장
  displayOrder: number;  // 우측 세로 배치 순서
  workOrders: WorkOrder[];  // 이 카테고리에 속한 작업들의 순서
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface WorkOrder {
  workId: string;
  order: number;  // 이 카테고리 내에서의 순서
}
```

### 설명
- 단순 텍스트 기반 카테고리
- 각 카테고리마다 작업 순서를 별도로 관리

### 예시
```json
{
  "id": "text-001",
  "name": "디자인",
  "displayOrder": 1,
  "workOrders": [
    { "workId": "work-001", "order": 1 },
    { "workId": "work-002", "order": 2 },
    { "workId": "work-003", "order": 3 }
  ],
  "isActive": true
}
```

---

## 4. Work (작업)

```typescript
interface Work {
  id: string;
  title: string;  // 작업 제목
  shortDescription?: string;  // 카드에 표시될 간단한 설명 (선택)
  fullDescription: string;  // 상세 페이지 본문
  thumbnailImageId: string;  // 대표 썸네일 이미지 ID
  images: WorkImage[];  // 작업 이미지들 (최대 50장)
  sentenceCategoryIds: string[];  // 속한 문장형 카테고리 키워드 ID들
  textCategoryIds: string[];  // 속한 텍스트형 카테고리 ID들
  isPublished: boolean;  // 공개/비공개
  viewCount?: number;  // 조회수 (선택, 분석 기능용)
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

interface WorkImage {
  id: string;
  url: string;  // 원본 이미지 URL (고해상도)
  thumbnailUrl: string;  // 1:1 썸네일 URL (300x300, 대표 이미지용)
  listThumbnailUrl?: string;  // 목록용 초소형 썸네일 (100x100, 성능 최적화)
  mediumUrl?: string;  // 중간 크기 URL (1200px 너비, 상세 페이지용)
  webpUrl?: string;  // WebP 포맷 URL (성능 최적화, 브라우저 지원 시)
  order: number;  // 이미지 순서 (1, 2, 3...)
  caption?: string;  // 이미지별 캡션 (HTML 형식, XSS 방지 처리됨)
  width: number;  // 원본 이미지 너비
  height: number;  // 원본 이미지 높이
  fileSize?: number;  // 파일 크기 (bytes)
  uploadedFrom?: 'desktop' | 'mobile' | 'camera';  // 업로드 출처 (선택)
}
```

### 설명
- `shortDescription`이 없으면 `fullDescription`을 잘라서 카드에 표시
- `thumbnailImageId`: `images` 배열 중 하나를 대표 썸네일로 지정
- 대표 썸네일은 1:1 비율로 크롭/리사이즈된 `thumbnailUrl` 사용
- `images`는 순서대로 정렬되어 상세 페이지에 표시
- `caption`은 HTML 형식으로 저장 (작업 링크 포함), DOMPurify로 sanitize 필수
- `viewCount`는 향후 분석 기능 추가 시 사용

### 이미지 최적화 전략
업로드 시 자동으로 여러 크기의 이미지 생성:

1. **원본** (`url`): 
   - 고해상도 유지
   - 상세 페이지 확대 시 사용
   
2. **썸네일** (`thumbnailUrl`): 
   - 300x300px, 1:1 비율
   - WebP 80% 품질
   - 카드 대표 이미지용
   
3. **목록용 초소형** (`listThumbnailUrl`):
   - 100x100px, 1:1 비율
   - WebP 70% 품질
   - 작업 목록에서 빠른 로딩
   - **성능 핵심**: 100개 작업 목록도 < 1초 렌더링
   
4. **중간 크기** (`mediumUrl`):
   - 1200px 너비 유지, 비율 유지
   - WebP 85% 품질
   - 상세 페이지 일반 보기용
   
5. **WebP 버전** (`webpUrl`):
   - 브라우저 지원 시 우선 사용
   - 파일 크기 30-50% 감소

### 모바일 촬영 지원
- `uploadedFrom` 필드로 업로드 출처 추적 (선택)
- 모바일 카메라로 직접 촬영한 이미지:
  - EXIF 데이터 처리 (위치 정보 제거 옵션)
  - 자동 회전 보정
  - 업로드 전 클라이언트 측 압축

### 예시
```json
{
  "id": "work-001",
  "title": "아름다운 바다",
  "shortDescription": "바다에서 영감을 받은 작업",
  "fullDescription": "이 작업은 제주도 바다에서 본 풍경을 재해석한 작업입니다...",
  "thumbnailImageId": "img-001",
  "images": [
    {
      "id": "img-001",
      "url": "/uploads/work-001/image1.jpg",
      "thumbnailUrl": "/uploads/work-001/image1_thumb.jpg",
      "order": 1,
      "caption": "이 장면은 <a href=\"/works/work-002\">고요한 산</a>에서 영감을 받았습니다.",
      "width": 1920,
      "height": 1080
    },
    {
      "id": "img-002",
      "url": "/uploads/work-001/image2.jpg",
      "order": 2,
      "caption": null,
      "width": 1920,
      "height": 1080
    }
  ],
  "sentenceCategoryIds": ["key-001", "key-002"],
  "textCategoryIds": ["text-001"],
  "isPublished": true,
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-20T15:30:00Z",
  "publishedAt": "2025-01-15T12:00:00Z"
}
```

---

## 5. 캡션 내 작업 링크 처리

### HTML 형식 예시
```html
이 작업은 <a href="/works/work-002" data-work-id="work-002">고요한 산</a>과 
<a href="/works/work-005" data-work-id="work-005">푸른 하늘</a>에서 영감을 받았습니다.
```

### Hover 시 Floating Window 표시
- 프론트엔드에서 `data-work-id` 속성을 읽어 해당 작업 정보 fetch
- Floating window에 표시할 정보:
  - 대표 썸네일 (`thumbnailUrl`)
  - 작업 제목 (`title`)
  - 간단한 설명 (`shortDescription` 또는 `fullDescription` 일부)

---

## 6. 데이터 관계 정리

### Work ↔ Category 관계
- **다대다 관계**: 한 작업이 여러 카테고리에 속할 수 있음
- 각 카테고리는 자체 `workOrders` 배열로 작업 순서 관리
- Work는 자신이 속한 카테고리 ID 목록만 보유

### 작업 순서 관리 예시
```
"물" 카테고리의 workOrders:
[
  { workId: "work-001", order: 1 },
  { workId: "work-003", order: 2 },
  { workId: "work-005", order: 3 }
]

"불" 카테고리의 workOrders:
[
  { workId: "work-003", order: 1 },
  { workId: "work-001", order: 2 }
]
```
→ work-001은 "물"에서 1번째, "불"에서 2번째로 표시됨

---

## 7. Admin 페이지 기능 요구사항

### 7.1 로그인
- Google OAuth 2.0
- 인증 후 JWT 토큰 발급
- 토큰으로 API 요청 인증

### 7.2 카테고리 관리

#### 문장형 카테고리
- 문장 입력
- 문장 내 단어 선택 (마우스 드래그로 범위 지정)
- 선택된 단어들을 카테고리 키워드로 등록
- 키워드별 작업 할당 및 순서 조정 (드래그 앤 드롭)
- 문장 순서 조정 (좌측 세로 배치 순서)

#### 텍스트형 카테고리
- 텍스트 입력 (단어 또는 문장)
- 작업 할당 및 순서 조정 (드래그 앤 드롭)
- 카테고리 순서 조정 (우측 세로 배치 순서)

### 7.3 작업 관리

#### 작업 생성/수정
1. 기본 정보
   - 제목
   - 간단한 설명 (선택)
   - 상세 설명 (본문)
   - 공개/비공개 상태

2. 이미지 업로드
   - 최대 50장
   - 드래그 앤 드롭으로 순서 조정
   - 대표 썸네일 지정 (라디오 버튼)
   - 대표 썸네일 자동 1:1 크롭/리사이즈

3. 이미지별 캡션
   - 각 이미지마다 캡션 입력 (WYSIWYG 에디터)
   - 에디터 내 "작업 링크" 버튼
     - 클릭 시 작업 검색 모달
     - 작업 선택 시 자동으로 HTML 링크 삽입: `<a href="/works/[id]" data-work-id="[id]">[작업명]</a>`

4. 카테고리 할당
   - 문장형 카테고리 키워드 선택 (다중 선택)
   - 텍스트형 카테고리 선택 (다중 선택)

#### 작업 목록
- 전체 작업 목록 (테이블 형식)
- 필터링: 공개/비공개, 카테고리별
- 정렬: 생성일, 수정일, 제목
- 검색: 제목, 설명

---

## 8. 프론트엔드 (사용자 페이지) 기능 요구사항

### 8.1 레이아웃
```
┌─────────────────────────────────────────────────────────┐
│                        Header                           │
├──────────┬──────────────────────────────────┬───────────┤
│          │                                  │           │
│  문장형   │         작업 카드들              │  텍스트형  │
│ 카테고리  │      (Horizontal Row)           │ 카테고리   │
│  (좌측)  │                                  │  (우측)   │
│          │                                  │           │
│          │                                  │           │
└──────────┴──────────────────────────────────┴───────────┘
```

### 8.2 카테고리 영역

#### 문장형 카테고리 (좌측)
- 문장들을 세로로 나열
- 각 문장 내 키워드에 hover 시 bold 처리
- 클릭 시 상단에 점(.) 표시
- 선택된 카테고리의 작업들을 중앙에 표시

#### 텍스트형 카테고리 (우측)
- 텍스트들을 세로로 나열
- 클릭 시 해당 카테고리 작업들을 중앙에 표시

### 8.3 작업 카드
- Horizontal row로 배치 (가로 스크롤)
- 카드 구성:
  - 대표 썸네일 (1:1)
  - 제목
  - 간단한 설명 (없으면 fullDescription 일부)
- 클릭 시 상세 페이지로 이동

### 8.4 작업 상세 페이지
- 이미지들을 순서대로 표시
- 각 이미지 우측 가장자리에 캡션 (left-aligned, 작은 텍스트)
- 캡션 내 작업 링크에 hover 시:
  - Floating window 표시 (해당 작업의 썸네일 + 간단한 설명)
  - 클릭 시 해당 작업 상세 페이지로 이동

---

## 9. API 엔드포인트 (예시)

### 인증
- `POST /api/auth/google` - Google OAuth 로그인
- `POST /api/auth/logout` - 로그아웃

### 카테고리
- `GET /api/categories/sentence` - 문장형 카테고리 목록
- `POST /api/categories/sentence` - 문장형 카테고리 생성
- `PUT /api/categories/sentence/:id` - 문장형 카테고리 수정
- `DELETE /api/categories/sentence/:id` - 문장형 카테고리 삭제
- `GET /api/categories/text` - 텍스트형 카테고리 목록
- `POST /api/categories/text` - 텍스트형 카테고리 생성
- `PUT /api/categories/text/:id` - 텍스트형 카테고리 수정
- `DELETE /api/categories/text/:id` - 텍스트형 카테고리 삭제

### 작업
- `GET /api/works` - 작업 목록 (필터링, 페이지네이션)
- `GET /api/works/:id` - 작업 상세
- `POST /api/works` - 작업 생성
- `PUT /api/works/:id` - 작업 수정
- `DELETE /api/works/:id` - 작업 삭제
- `POST /api/works/:id/images` - 이미지 업로드
- `PUT /api/works/:id/images/order` - 이미지 순서 변경
- `DELETE /api/works/:workId/images/:imageId` - 이미지 삭제

### 카테고리별 작업 순서
- `PUT /api/categories/sentence/:categoryId/work-orders` - 문장형 카테고리 작업 순서 변경
- `PUT /api/categories/text/:categoryId/work-orders` - 텍스트형 카테고리 작업 순서 변경

---

## 10. 기술 스택

### 데이터베이스 추상화 (Firebase 또는 Supabase)

**선택 가능한 옵션**:
- **Firebase**: 무료 한도가 넉넉, NoSQL 기반
- **Supabase**: PostgreSQL 기반, 이미지 변환 내장

**인터페이스 기반 설계**로 나중에 선택 또는 변경 가능:

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
  
  createTextCategory(category: TextCategory): Promise<TextCategory>;
  updateTextCategory(id: string, category: Partial<TextCategory>): Promise<TextCategory>;
  listTextCategories(): Promise<TextCategory[]>;
  
  // Work Orders
  updateWorkOrders(categoryId: string, orders: WorkOrder[]): Promise<void>;
}

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
  thumbnailUrl: string;
  listThumbnailUrl: string;
  mediumUrl: string;
  webpUrl?: string;
  width: number;
  height: number;
}
```

### Frontend (관리자 페이지)
- **Framework**: React 18 + TypeScript
- **UI Library**: **Ant Design 5.x** (관리자 페이지 최적화)
  - Form, Table, Upload, Modal 등 내장
  - 한국어 지원
  - 완전 반응형 (모바일 지원)
- **State Management**: 
  - React Query (서버 상태, 캐싱)
  - Zustand (클라이언트 상태)
- **Form**: Ant Design Form (내장)
- **Rich Text Editor**: Tiptap 2.x (캡션 작성, 작업 링크)
- **Drag & Drop**: react-beautiful-dnd (Ant Design 호환)
- **Image Upload**: Ant Design Upload + react-dropzone
- **Routing**: React Router v6
- **Icons**: @ant-design/icons
- **Build Tool**: Vite (빠른 개발 환경)

### Frontend (사용자 페이지)
- **Framework**: Next.js 14+ + TypeScript
  - SSR/SSG로 SEO 최적화
  - Image 컴포넌트로 자동 최적화
- **UI**: Tailwind CSS (커스텀 디자인)
- **Animation**: Framer Motion (hover, floating window)

### 성능 최적화 도구
- **이미지 처리**: Sharp (Node.js) 또는 Firebase/Supabase 내장 기능
- **번들 최적화**: Vite의 Code Splitting
- **캐싱**: React Query (5분), CDN (30일)
- **가상 스크롤**: react-window (100+ 작업 목록)
- **Lazy Loading**: IntersectionObserver API

### 인증
- **Google OAuth 2.0**
- Firebase Authentication 또는 Supabase Auth
- JWT 토큰 (7일 만료)

### 배포
- **Frontend**: Vercel 또는 Netlify (자동 배포)
- **Database & Storage**: Firebase 또는 Supabase (managed)
- **CDN**: Cloudflare (이미지 캐싱)

---

## 11. 데이터베이스 스키마

**참고**: 이 스키마는 Supabase(PostgreSQL) 기준입니다. 
Firebase(NoSQL)를 선택하는 경우 컬렉션 구조로 변환됩니다.

### PostgreSQL 스키마 (Supabase)

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  google_id VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  profile_image VARCHAR(500),
  role VARCHAR(20) NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMP
);

-- Sentence Categories
CREATE TABLE sentence_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sentence TEXT NOT NULL,
  display_order INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Keyword Categories (문장 내 선택된 단어들)
CREATE TABLE keyword_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sentence_category_id UUID NOT NULL REFERENCES sentence_categories(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  start_index INTEGER NOT NULL,
  end_index INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Text Categories
CREATE TABLE text_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  display_order INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Works
CREATE TABLE works (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  short_description TEXT,
  full_description TEXT NOT NULL,
  thumbnail_image_id UUID,
  is_published BOOLEAN NOT NULL DEFAULT false,
  view_count INTEGER DEFAULT 0,  -- 조회수 (분석용)
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  published_at TIMESTAMP
);

-- Work Images
CREATE TABLE work_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id UUID NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  url VARCHAR(500) NOT NULL,                  -- 원본
  thumbnail_url VARCHAR(500) NOT NULL,         -- 300x300 썸네일
  list_thumbnail_url VARCHAR(500),             -- 100x100 목록용 (성능)
  medium_url VARCHAR(500),                     -- 1200px 중간 크기
  webp_url VARCHAR(500),                       -- WebP 버전
  order_index INTEGER NOT NULL,
  caption TEXT,                                -- HTML 형식
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  file_size INTEGER,                           -- bytes
  uploaded_from VARCHAR(20),                   -- desktop/mobile/camera
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Work to Keyword Category (다대다)
CREATE TABLE work_keyword_categories (
  work_id UUID NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  keyword_category_id UUID NOT NULL REFERENCES keyword_categories(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  PRIMARY KEY (work_id, keyword_category_id)
);

-- Work to Text Category (다대다)
CREATE TABLE work_text_categories (
  work_id UUID NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  text_category_id UUID NOT NULL REFERENCES text_categories(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  PRIMARY KEY (work_id, text_category_id)
);

-- 성능 최적화를 위한 Indexes
CREATE INDEX idx_keyword_categories_sentence ON keyword_categories(sentence_category_id);
CREATE INDEX idx_work_images_work ON work_images(work_id);
CREATE INDEX idx_work_images_order ON work_images(work_id, order_index);  -- 순서 조회 최적화
CREATE INDEX idx_work_keyword_categories_work ON work_keyword_categories(work_id);
CREATE INDEX idx_work_keyword_categories_keyword ON work_keyword_categories(keyword_category_id);
CREATE INDEX idx_work_text_categories_work ON work_text_categories(work_id);
CREATE INDEX idx_work_text_categories_text ON work_text_categories(text_category_id);
CREATE INDEX idx_works_published ON works(is_published, created_at DESC);  -- 목록 조회 최적화
CREATE INDEX idx_works_view_count ON works(view_count DESC);  -- 인기 작업 조회
```

### Firebase (NoSQL) 구조 예시

Firebase를 선택하는 경우의 컬렉션 구조:

```typescript
// Firestore Collections
{
  users: {
    [userId]: User
  },
  
  sentenceCategories: {
    [categoryId]: SentenceCategory
  },
  
  textCategories: {
    [categoryId]: TextCategory
  },
  
  works: {
    [workId]: Work
  },
  
  // 카테고리별 작업 순서 (별도 컬렉션)
  categoryWorkOrders: {
    [categoryId]: {
      workOrders: WorkOrder[]
    }
  }
}

// Firebase Storage 구조
/works/{workId}/
  ├── original/
  ├── thumbnail/      (300x300)
  ├── list-thumb/     (100x100)
  ├── medium/         (1200px)
  └── webp/
```

---
CREATE TABLE text_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  display_order INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Works
CREATE TABLE works (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  short_description TEXT,
  full_description TEXT NOT NULL,
  thumbnail_image_id UUID,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  published_at TIMESTAMP
);

-- Work Images
CREATE TABLE work_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id UUID NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  order_index INTEGER NOT NULL,
  caption TEXT,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Work to Keyword Category (다대다)
CREATE TABLE work_keyword_categories (
  work_id UUID NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  keyword_category_id UUID NOT NULL REFERENCES keyword_categories(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  PRIMARY KEY (work_id, keyword_category_id)
);

-- Work to Text Category (다대다)
CREATE TABLE work_text_categories (
  work_id UUID NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  text_category_id UUID NOT NULL REFERENCES text_categories(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  PRIMARY KEY (work_id, text_category_id)
);

-- Indexes
CREATE INDEX idx_keyword_categories_sentence ON keyword_categories(sentence_category_id);
CREATE INDEX idx_work_images_work ON work_images(work_id);
CREATE INDEX idx_work_keyword_categories_work ON work_keyword_categories(work_id);
CREATE INDEX idx_work_keyword_categories_keyword ON work_keyword_categories(keyword_category_id);
CREATE INDEX idx_work_text_categories_work ON work_text_categories(work_id);
CREATE INDEX idx_work_text_categories_text ON work_text_categories(text_category_id);
```

---

## 12. 추가 고려사항

### 12.1 이미지 최적화 전략

**업로드 시 자동 처리 파이프라인**:
```
원본 업로드 (10MB JPEG)
    ↓
1. 원본 저장 (고해상도, 원본 포맷)
    ↓
2. 썸네일 생성 (300x300, 1:1, WebP 80%)
    ↓
3. 목록용 초소형 생성 (100x100, 1:1, WebP 70%)
    ↓
4. 중간 크기 생성 (1200px 너비, 비율 유지, WebP 85%)
    ↓
5. 메타데이터 추출 (width, height, fileSize)
    ↓
6. DB에 모든 URL 저장
```

**브라우저별 최적화**:
- WebP 지원 브라우저: WebP 버전 우선 로드
- 미지원 브라우저: JPEG/PNG로 fallback
- `<picture>` 태그 또는 Next.js Image 컴포넌트 활용

**Lazy Loading**:
- IntersectionObserver API 사용
- 화면에 보이는 이미지만 로드
- Placeholder: Skeleton 또는 blur 이미지

### 12.2 성능 최적화

**작업 목록 (핵심 최적화 대상)**:
- **가상 스크롤**: react-window로 100+ 작업도 < 1초 렌더링
- **Pagination**: 20개씩 로드, 무한 스크롤
- **캐싱**: React Query로 5분간 캐싱
- **Prefetching**: 다음 페이지 미리 로드
- **목록용 초소형 썸네일 (100x100)**: 빠른 로딩

**데이터 페치**:
- 목록: 필요한 필드만 (id, title, thumbnail, status)
- 상세: 클릭 시 전체 데이터 로드
- GraphQL 또는 필드 선택 API

**캐싱 전략**:
- 이미지: CDN 캐싱 30일
- API 응답: React Query 5분
- 정적 자산: 브라우저 캐싱 1년

**Next.js SSG/ISR** (사용자 페이지):
- 작업 목록: ISR (10분마다 재생성)
- 작업 상세: SSG (빌드 시 생성)
- 카테고리: SSG

### 12.3 SEO 최적화 (향후 Phase 4)

**메타 태그 자동 생성**:
```html
<title>{작업 제목} | 포트폴리오</title>
<meta name="description" content="{간단한 설명}" />
<meta property="og:title" content="{작업 제목}" />
<meta property="og:description" content="{간단한 설명}" />
<meta property="og:image" content="{썸네일 URL}" />
<meta property="og:type" content="website" />
<meta name="twitter:card" content="summary_large_image" />
```

**구조화된 데이터 (Schema.org)**:
```json
{
  "@context": "https://schema.org",
  "@type": "CreativeWork",
  "name": "작품명",
  "image": "썸네일 URL",
  "description": "설명",
  "creator": {
    "@type": "Person",
    "name": "작가명"
  }
}
```

**Sitemap 자동 생성**:
- XML Sitemap (`/sitemap.xml`)
- 새 작업 발행 시 자동 업데이트
- Google Search Console 제출

**이미지 SEO**:
- Alt 태그: 작업 제목 자동 삽입
- 파일명: `work-title-1.jpg` (의미있는 이름)

### 12.4 보안

**인증/인가**:
- Google OAuth Only (복잡한 비밀번호 관리 불필요)
- JWT 토큰 7일 만료
- HttpOnly Cookie로 저장

**파일 업로드 보안**:
```typescript
// 클라이언트 측 검증
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// 서버 측 검증 (필수!)
- MIME type 재확인
- 파일 확장자 검증
- Magic bytes 체크 (실제 이미지인지)
- 파일명 sanitization
```

**XSS 방지**:
- 캡션 HTML: DOMPurify로 sanitization
- 허용 태그: `<a>`, `<strong>`, `<em>`, `<u>`
- 허용 속성: `href`, `data-work-id`
- `<script>` 태그 완전 차단

**CSRF 방지**:
- CSRF 토큰 자동 포함
- SameSite Cookie 설정

**Rate Limiting**:
- 이미지 업로드: 시간당 100개
- API 요청: 분당 60개

### 12.5 모바일 지원

**카메라 직접 촬영**:
```html
<!-- 카메라 직접 실행 -->
<input type="file" accept="image/*" capture="camera" multiple />

<!-- 또는 전면/후면 선택 -->
<input type="file" accept="image/*" capture="environment" /> <!-- 후면 -->
<input type="file" accept="image/*" capture="user" /> <!-- 전면 -->
```

**EXIF 데이터 처리**:
- 위치 정보 자동 제거 (Privacy)
- 촬영 일시 보존 (선택)
- 방향 정보로 자동 회전

**모바일 최적화**:
- 업로드 전 클라이언트 측 압축
- 진행률 표시
- 느린 네트워크 대응 (재시도 로직)

### 12.6 분석 기능 (향후 Phase 4)

**Google Analytics 4 연동**:
- 페이지뷰 추적
- 작품 조회수
- 카테고리 클릭
- 평균 체류 시간

**관리자 대시보드**:
- 일별/주별/월별 통계
- 인기 작품 TOP 10
- 유입 경로 분석

---

## 결정된 사항 요약

✅ **확정된 내용**:
1. **UI Framework**: Ant Design 5.x (관리자), Tailwind (사용자)
2. **완전 반응형**: 모바일에서도 모든 기능 동작
3. **성능 최적화**: 작업 목록 < 1초 렌더링
4. **이미지 전략**: 다중 해상도 자동 생성
5. **Google OAuth**: 단일 인증 방식

⏳ **보류/향후 결정**:
1. **Database**: Firebase vs Supabase (인터페이스로 추상화)
2. **SEO/분석**: Phase 4에서 추가
3. **워터마크**: 의뢰인과 상의
4. **다국어**: 필요 시 검토

---
