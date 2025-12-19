/**
 * Auth API - Firebase Authentication 직접 접근
 */
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from './client';
import { collections } from '../../core/constants';
import { mapFirebaseUserToUser } from '../mappers';
import type { User } from '../../core/types';

/**
 * Firestore에서 사용자 추가 정보 조회
 */
const fetchUserData = async (uid: string): Promise<Record<string, unknown> | null> => {
  const userDocRef = doc(db, collections.users, uid);
  const userDoc = await getDoc(userDocRef);
  return userDoc.exists() ? userDoc.data() : null;
};

/**
 * Firestore에 사용자 정보 저장/업데이트
 */
const saveUserData = async (user: User, isNew: boolean): Promise<void> => {
  const userDocRef = doc(db, collections.users, user.id);

  if (isNew) {
    await setDoc(userDocRef, {
      email: user.email,
      googleId: user.googleId,
      displayName: user.displayName,
      profileImage: user.profileImage,
      role: 'viewer',
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    });
  } else {
    await setDoc(
      userDocRef,
      {
        lastLoginAt: serverTimestamp(),
        displayName: user.displayName,
        profileImage: user.profileImage,
      },
      { merge: true }
    );
  }
};

/**
 * Google 로그인
 */
export const loginWithGoogle = async (): Promise<User> => {
  const result = await signInWithPopup(auth, googleProvider);
  const firestoreData = await fetchUserData(result.user.uid);
  const isNew = !firestoreData;
  const user = mapFirebaseUserToUser(result.user, firestoreData || undefined);
  await saveUserData(user, isNew);
  return user;
};

/**
 * 로그아웃
 */
export const logout = async (): Promise<void> => {
  await signOut(auth);
};

/**
 * 현재 로그인된 사용자 가져오기
 */
export const getCurrentUser = (): Promise<User | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      unsubscribe();
      if (firebaseUser) {
        const firestoreData = await fetchUserData(firebaseUser.uid);
        const user = mapFirebaseUserToUser(firebaseUser, firestoreData || undefined);
        resolve(user);
      } else {
        resolve(null);
      }
    });
  });
};

/**
 * 인증 상태 변경 리스너
 */
export const onAuthChange = (callback: (user: User | null) => void): (() => void) => {
  return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      const firestoreData = await fetchUserData(firebaseUser.uid);
      const user = mapFirebaseUserToUser(firebaseUser, firestoreData || undefined);
      callback(user);
    } else {
      callback(null);
    }
  });
};

/**
 * 사용자 역할 변경
 */
export const setUserRole = async (userId: string, role: 'admin' | 'viewer'): Promise<void> => {
  const userDocRef = doc(db, collections.users, userId);
  await setDoc(userDocRef, { role }, { merge: true });
};

/**
 * 관리자 여부 확인
 */
export const isAdmin = (user: User | null): boolean => {
  return user?.role === 'admin';
};
