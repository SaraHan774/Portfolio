/**
 * Firebase Client - 중앙 집중식 Firebase 초기화
 *
 * 모든 Firebase 서비스 인스턴스를 여기서 관리합니다.
 * API 모듈들은 이 클라이언트를 import하여 사용합니다.
 */
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
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
