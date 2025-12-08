// Firebase Authentication 서비스
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '../config/firebase';
import type { User } from '../types';

// Firebase User를 앱 User 타입으로 변환
const mapFirebaseUserToUser = async (firebaseUser: FirebaseUser): Promise<User> => {
  // Firestore에서 추가 사용자 정보 조회
  const userDocRef = doc(db, 'users', firebaseUser.uid);
  const userDoc = await getDoc(userDocRef);

  if (userDoc.exists()) {
    const userData = userDoc.data();
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      googleId: firebaseUser.providerData[0]?.uid || '',
      displayName: firebaseUser.displayName || '',
      profileImage: firebaseUser.photoURL || undefined,
      role: userData.role || 'viewer',
      createdAt: userData.createdAt?.toDate() || new Date(),
      lastLoginAt: new Date(),
    };
  }

  // 신규 사용자인 경우 기본값 반환
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email || '',
    googleId: firebaseUser.providerData[0]?.uid || '',
    displayName: firebaseUser.displayName || '',
    profileImage: firebaseUser.photoURL || undefined,
    role: 'viewer', // 기본 역할은 viewer
    createdAt: new Date(),
    lastLoginAt: new Date(),
  };
};

// Firestore에 사용자 정보 저장/업데이트
const saveUserToFirestore = async (user: User): Promise<void> => {
  const userDocRef = doc(db, 'users', user.id);
  const userDoc = await getDoc(userDocRef);

  if (userDoc.exists()) {
    // 기존 사용자: lastLoginAt만 업데이트
    await setDoc(
      userDocRef,
      {
        lastLoginAt: serverTimestamp(),
        displayName: user.displayName,
        profileImage: user.profileImage,
      },
      { merge: true }
    );
  } else {
    // 신규 사용자: 전체 정보 저장
    await setDoc(userDocRef, {
      email: user.email,
      googleId: user.googleId,
      displayName: user.displayName,
      profileImage: user.profileImage,
      role: 'viewer', // 신규 사용자는 기본적으로 viewer
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    });
  }
};

// Google 로그인
export const loginWithGoogle = async (): Promise<User> => {
  const result = await signInWithPopup(auth, googleProvider);
  const user = await mapFirebaseUserToUser(result.user);
  await saveUserToFirestore(user);
  return user;
};

// 로그아웃
export const logout = async (): Promise<void> => {
  await signOut(auth);
};

// 현재 로그인된 사용자 가져오기
export const getCurrentUser = (): Promise<User | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      unsubscribe();
      if (firebaseUser) {
        const user = await mapFirebaseUserToUser(firebaseUser);
        resolve(user);
      } else {
        resolve(null);
      }
    });
  });
};

// 인증 상태 변경 리스너
export const onAuthChange = (callback: (user: User | null) => void): (() => void) => {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const user = await mapFirebaseUserToUser(firebaseUser);
      callback(user);
    } else {
      callback(null);
    }
  });
};

// 사용자 역할 확인
export const isAdmin = (user: User | null): boolean => {
  return user?.role === 'admin';
};

// 관리자 권한 부여 (Firestore에서 직접 수정 필요)
export const setUserRole = async (userId: string, role: 'admin' | 'viewer'): Promise<void> => {
  const userDocRef = doc(db, 'users', userId);
  await setDoc(userDocRef, { role }, { merge: true });
};
