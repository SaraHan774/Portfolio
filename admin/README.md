# Portfolio Admin

포트폴리오 관리자 페이지 - Firebase 기반

## 🚀 빠른 시작

### 1. 환경 변수 설정

`.env.example` 파일을 복사하여 `.env` 파일을 생성하고 Firebase 설정값을 입력합니다:

```bash
cp .env.example .env
```

`.env` 파일 내용:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 2. 개발 서버 실행

```bash
npm install
npm run dev
```

### 3. 프로덕션 빌드

```bash
npm run build
```

빌드된 파일은 `dist` 폴더에 생성됩니다.

## 🔥 Firebase 설정

### Firebase Console 설정

1. [Firebase Console](https://console.firebase.google.com)에서 프로젝트 생성
2. 다음 서비스 활성화:
   - **Authentication**: Google 로그인 활성화
   - **Firestore Database**: 데이터베이스 생성
   - **Storage**: 스토리지 버킷 생성

### Firebase Hosting 배포

```bash
# Firebase CLI 설치 (최초 1회)
npm install -g firebase-tools

# Firebase 로그인
firebase login

# 배포
npm run deploy
```

또는 빌드만 따로 실행 후 배포:
```bash
npm run build
firebase deploy --only hosting
```

**배포 URL**: https://portfolio-nhb.web.app

## 📁 프로젝트 구조

```
admin/
├── src/
│   ├── components/     # 재사용 컴포넌트
│   ├── config/         # Firebase 설정
│   ├── hooks/          # React Query 커스텀 훅
│   ├── layouts/        # 레이아웃 컴포넌트
│   ├── pages/          # 페이지 컴포넌트
│   ├── services/       # Firebase 서비스 함수
│   ├── stores/         # Zustand 상태 관리
│   └── types/          # TypeScript 타입 정의
├── .env.example        # 환경 변수 템플릿
├── firebase.json       # Firebase Hosting 설정
└── .firebaserc         # Firebase 프로젝트 설정
```

## 🔧 기술 스택

- **Frontend**: React 19, TypeScript, Vite
- **UI**: Ant Design
- **상태 관리**: Zustand, TanStack Query
- **라우팅**: React Router
- **Backend**: Firebase (Auth, Firestore, Storage)
- **배포**: Firebase Hosting

## 📋 주요 기능

### 작업 관리
- 작업 목록 조회/검색/필터링
- 작업 추가/수정/삭제
- 이미지 업로드 (Firebase Storage)
- 임시저장 (비공개) / 게시 (공개) 기능

### 카테고리 관리
- 문장형 카테고리 (키워드 선택)
- 전시명 카테고리

### 인증
- Google 로그인

## 📝 참고사항

- Firebase API 키는 클라이언트용으로 설계되어 있으며, Firebase Security Rules로 보안이 관리됩니다
- `.env` 파일은 Git에 커밋되지 않습니다 (`.gitignore`에 포함)
