// 환경 설정 상수

/**
 * Firebase 설정 - 환경변수에서 로드
 */
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
} as const;

/**
 * 환경변수 검증
 */
export const isFirebaseConfigValid = (): boolean => {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
};

/**
 * 앱 설정
 */
export const appConfig = {
  // 이미지 업로드 설정
  image: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    thumbnail: {
      maxWidth: 300,
      maxHeight: 300,
      quality: 0.7,
    },
    medium: {
      maxWidth: 800,
      maxHeight: 800,
      quality: 0.8,
    },
  },
  // 텍스트 제한
  text: {
    captionMaxLength: 1000,
    titleMaxLength: 200,
    descriptionMaxLength: 5000,
  },
  // 페이지네이션 기본값
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
  },
} as const;
