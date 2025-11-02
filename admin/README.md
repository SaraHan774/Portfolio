# Portfolio Admin

포트폴리오 관리자 페이지

## 🚀 빠른 시작

### 개발 서버 실행
```bash
npm install
npm run dev
```

### 프로덕션 빌드
```bash
npm run build
```

빌드된 파일은 `dist` 폴더에 생성됩니다.

## 📦 호스팅 가이드

이 프로젝트는 다양한 플랫폼에서 쉽게 호스팅할 수 있습니다.

### 1. Vercel (추천 - 가장 간단) ⚡

1. GitHub에 코드를 푸시합니다
2. [Vercel](https://vercel.com)에 접속하여 GitHub 계정으로 로그인
3. "Add New Project" 클릭
4. 저장소 선택 후 "Import"
5. Vercel이 자동으로 설정을 감지합니다 (vercel.json 파일 참조)
6. "Deploy" 클릭

**장점:**
- GitHub 연동으로 자동 배포
- 커밋 시마다 자동 재배포
- 무료 SSL 인증서
- CDN 제공으로 빠른 로딩 속도

### 2. Netlify 🎯

**방법 1: GitHub 연동 (추천)**
1. GitHub에 코드를 푸시합니다
2. [Netlify](https://www.netlify.com)에 접속하여 GitHub 계정으로 로그인
3. "Add new site" → "Import an existing project"
4. 저장소 선택
5. 빌드 설정:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. "Deploy site" 클릭

**방법 2: 드래그 앤 드롭**
1. `npm run build` 실행하여 dist 폴더 생성
2. [Netlify Drop](https://app.netlify.com/drop)에 접속
3. `dist` 폴더를 드래그 앤 드롭

**장점:**
- 간단한 설정
- 무료 SSL 인증서
- CDN 제공

### 3. GitHub Pages 📄

GitHub Pages는 서브디렉토리에 있는 프로젝트를 직접 배포하기 어려우므로, 별도 저장소를 만들거나 GitHub Actions를 사용해야 합니다.

**방법:**
1. `admin` 폴더를 별도 저장소로 만들거나
2. GitHub Actions를 사용하여 자동 배포 설정

### 4. Firebase Hosting 🔥

1. Firebase CLI 설치: `npm install -g firebase-tools`
2. Firebase 로그인: `firebase login`
3. 프로젝트 초기화: `firebase init hosting`
4. 설정:
   - Public directory: `dist`
   - Single-page app: `Yes`
   - Overwrite index.html: `No`
5. 배포: `firebase deploy`

**장점:**
- Google 계정으로 간편 로그인
- 무료 할당량 제공
- 실시간 데이터베이스와 통합 가능

## 📝 참고사항

- 모든 호스팅 플랫폼에서 SPA 라우팅을 위해 `/` 경로로 들어오는 모든 요청을 `index.html`로 리다이렉트해야 합니다
- 설정 파일이 이미 포함되어 있습니다:
  - `vercel.json` (Vercel용)
  - `netlify.toml` (Netlify용)
  - `_redirects` (Netlify 드래그 앤 드롭용)

## 🔧 기술 스택

- React 19
- TypeScript
- Vite
- Ant Design
- React Router
- Zustand
- TanStack Query
