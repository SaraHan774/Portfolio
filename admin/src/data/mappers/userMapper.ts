/**
 * User Mapper - Firebase Auth/Firestore 데이터 <-> Domain Model 변환
 */
import type { User as FirebaseUser } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';
import type { User } from '../../core/types';

/**
 * Firebase Auth User + Firestore 데이터를 앱 User 모델로 변환
 */
export const mapFirebaseUserToUser = (
  firebaseUser: FirebaseUser,
  firestoreData?: Record<string, unknown>
): User => ({
  id: firebaseUser.uid,
  email: firebaseUser.email || '',
  googleId: firebaseUser.providerData[0]?.uid || '',
  displayName: firebaseUser.displayName || '',
  profileImage: firebaseUser.photoURL || undefined,
  role: (firestoreData?.role as 'admin' | 'viewer') || 'viewer',
  createdAt: (firestoreData?.createdAt as Timestamp)?.toDate() || new Date(),
  lastLoginAt: new Date(),
});

/**
 * User 도메인 모델을 Firestore 저장용 데이터로 변환
 */
export const mapUserToFirestore = (
  user: User,
  isNew: boolean
): Record<string, unknown> => {
  if (isNew) {
    return {
      email: user.email,
      googleId: user.googleId,
      displayName: user.displayName,
      profileImage: user.profileImage,
      role: 'viewer', // 신규 사용자는 기본적으로 viewer
    };
  }

  // 기존 사용자: 로그인 관련 정보만 업데이트
  return {
    displayName: user.displayName,
    profileImage: user.profileImage,
  };
};
