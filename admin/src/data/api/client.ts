/**
 * Firebase Client - 중앙 집중식 Firebase 초기화
 *
 * 모든 Firebase 서비스 인스턴스를 여기서 관리합니다.
 * API 모듈들은 이 클라이언트를 import하여 사용합니다.
 */
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { firebaseConfig, isFirebaseConfigValid } from '../../core/constants';

// 필수 환경변수 확인
if (!isFirebaseConfigValid()) {
  console.error('Firebase 환경변수가 설정되지 않았습니다. .env 파일을 확인해주세요.');
}

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// Firebase 서비스 인스턴스
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// 개발 환경에서 Firebase Emulator 연결
if (import.meta.env.DEV) {
  const emulatorFlag = import.meta.env.VITE_USE_FIREBASE_EMULATOR;
  console.log(`[Firebase] DEV 모드 | VITE_USE_FIREBASE_EMULATOR=${emulatorFlag}`);

  if (emulatorFlag === 'true') {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 9199);
    console.log('🔧 Firebase Emulator에 연결되었습니다 (localhost:8080, 9099, 9199)');
  } else {
    console.warn('⚠️ DEV 모드에서 프로덕션 Firebase에 연결 중입니다. Emulator를 사용하려면 npm run dev:emulator 를 실행하세요.');
  }
}

// Google Auth Provider 설정
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Analytics (브라우저 환경에서만 초기화)
export const initAnalytics = async () => {
  if (await isSupported()) {
    return getAnalytics(app);
  }
  return null;
};

export default app;
