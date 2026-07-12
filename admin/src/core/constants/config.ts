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
    original: {
      maxWidth: 1920,
      maxHeight: 1920,
      quality: 0.9,
    },
    // LQIP(저해상도 블러 플레이스홀더) 생성 설정.
    // width/quality로 1차 생성 후, data URL 길이가 maxDataUrlLength를 넘으면
    // fallbackSteps를 순서대로 시도한다(모두 실패하면 빈 문자열 → graceful).
    lqip: {
      width: 20,
      quality: 0.5,
      maxDataUrlLength: 2048,
      fallbackSteps: [
        { width: 16, quality: 0.4 },
        { width: 12, quality: 0.3 },
      ],
    },
  },
  // 텍스트 제한
  text: {
    captionMaxLength: 1000,
    imageCaptionMaxLength: 200,
    titleMaxLength: 200,
    descriptionMaxLength: 5000,
  },
  // 페이지네이션 기본값
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
  },
} as const;
