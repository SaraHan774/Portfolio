# Firebase Emulator 로컬 개발 가이드

프로덕션 Firebase에 영향을 주지 않고 로컬에서 개발/테스트하기 위한 가이드.

## 사전 요구사항

- Node.js
- Java 11+ (`java -version`으로 확인)
- Firebase CLI (`firebase --version`으로 확인, 없으면 `npm i -g firebase-tools`)

## 빠른 시작

터미널 3개를 열고 순서대로 실행:

```bash
# 터미널 1: Emulator 시작
cd ~/Portfolio
firebase emulators:start --project portfolio-nhb

# 터미널 2: Admin 앱 (작품 업로드/관리)
cd ~/Portfolio/admin
npm run dev:emulator

# 터미널 3: Front 앱 (작품 표시 확인)
cd ~/Portfolio/front
npm run dev:emulator
```

## Emulator 서비스 포트

| 서비스 | URL | 용도 |
|---|---|---|
| Emulator UI | http://localhost:4000 | 데이터 확인/관리 대시보드 |
| Auth | localhost:9099 | 인증 (테스트 계정) |
| Firestore | localhost:8080 | 데이터베이스 |
| Storage | localhost:9199 | 파일 저장소 |

## 로그인

- **Admin (Emulator 모드)**: 로그인 페이지에 "테스트 계정으로 로그인" 버튼이 표시됨
  - `admin@test.com` 계정이 자동 생성되며 admin 권한 부여
  - Google OAuth 대신 Email/Password 방식 사용
- **Front**: 인증 불필요 (공개 페이지)

## 데이터 관리

### 데이터 확인

Emulator UI(http://localhost:4000)에서 Firestore, Storage, Auth 데이터를 직접 확인/수정 가능.

### 데이터 자동 유지

`npm run emulators`는 종료 시 자동으로 데이터를 저장하고, 다음 시작 시 자동으로 복원함.

```bash
cd ~/Portfolio/admin
npm run emulators     # 데이터 자동 저장/복원 (기본)
npm run emulators:clean  # 빈 상태로 시작 (저장된 데이터 무시)
```

데이터는 `admin/emulator-data/` 폴더에 저장됨 (`.gitignore`에 포함).

## 동작 원리

### Admin (`admin/`)

- `npm run dev:emulator`가 `VITE_USE_FIREBASE_EMULATOR=true` 환경변수 설정
- `src/data/api/client.ts`에서 이 값을 감지하면 Auth/Firestore/Storage를 로컬 emulator에 연결
- 브라우저 콘솔에 `🔧 Firebase Emulator에 연결되었습니다` 메시지 확인

### Front (`front/`)

- `npm run dev:emulator`가 `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true` 환경변수 설정
- `src/data/api/client.ts`에서 Firestore/Storage를 로컬 emulator에 연결
- 브라우저 콘솔에 `🔧 [Front] Firebase Emulator에 연결되었습니다` 메시지 확인

### 프로덕션 안전성

- `npm run dev` (emulator 없이) 실행하면 기존처럼 프로덕션 Firebase에 연결
- `npm run build` / `npm run deploy`는 emulator 설정과 무관하게 프로덕션 빌드
- Emulator 연결 코드는 환경변수가 명시적으로 `'true'`일 때만 활성화

## 관련 파일

| 파일 | 역할 |
|---|---|
| `firebase.json` | Emulator 포트 설정 |
| `storage.rules` | Storage emulator 보안 규칙 |
| `admin/.env.development` | Admin emulator 환경변수 |
| `admin/src/data/api/client.ts` | Admin Firebase 초기화 + emulator 연결 |
| `front/src/data/api/client.ts` | Front Firebase 초기화 + emulator 연결 |

## 트러블슈팅

### Emulator가 Hosting만 실행되는 경우

`firebase emulators:start`를 **프로젝트 루트**(`~/Portfolio`)에서 실행해야 함. `admin/` 폴더에서 실행하면 `admin/firebase.json`을 읽어 Hosting만 시작됨.

### Storage emulator 시작 실패

`storage.rules` 파일이 프로젝트 루트에 있는지 확인. `firebase.json`에 `"storage": { "rules": "storage.rules" }` 설정 필요.

### 콘솔에 emulator 연결 메시지가 안 보이는 경우

dev 서버를 재시작해야 환경변수가 반영됨. `npm run dev:emulator`로 다시 시작.
