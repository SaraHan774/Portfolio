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
import { AuthError } from '../../core/errors';
import { createLogger } from '../../core/utils';
import { mapFirebaseUserToUser } from '../mappers';
import type { User } from '../../core/types';

const logger = createLogger('authApi');

/**
 * Firestore에서 사용자 추가 정보 조회
 */
const fetchUserData = async (uid: string): Promise<Record<string, unknown> | null> => {
  try {
    const userDocRef = doc(db, collections.users, uid);
    const userDoc = await getDoc(userDocRef);
    return userDoc.exists() ? userDoc.data() : null;
  } catch (error) {
    logger.error('사용자 데이터 조회 실패', error, { action: 'fetchUserData', userId: uid });
    throw new AuthError('사용자 정보를 불러오는데 실패했습니다.', 'USER_DATA_FETCH_ERROR');
  }
};

/**
 * Firestore에 사용자 정보 저장/업데이트
 */
const saveUserData = async (user: User, isNew: boolean): Promise<void> => {
  try {
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
      logger.info('새 사용자 생성', { action: 'saveUserData', userId: user.id });
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
  } catch (error) {
    logger.error('사용자 데이터 저장 실패', error, { action: 'saveUserData', userId: user.id });
    throw new AuthError('사용자 정보 저장에 실패했습니다.', 'USER_DATA_SAVE_ERROR');
  }
};

/**
 * Google 로그인
 */
export const loginWithGoogle = async (): Promise<User> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const firestoreData = await fetchUserData(result.user.uid);
    const isNew = !firestoreData;
    const user = mapFirebaseUserToUser(result.user, firestoreData || undefined);
    await saveUserData(user, isNew);
    logger.info('로그인 성공', { action: 'loginWithGoogle', userId: user.id });
    return user;
  } catch (error) {
    logger.error('로그인 실패', error, { action: 'loginWithGoogle' });
    throw new AuthError('로그인에 실패했습니다. 다시 시도해주세요.', 'LOGIN_ERROR');
  }
};

/**
 * 로그아웃
 */
export const logout = async (): Promise<void> => {
  try {
    await signOut(auth);
    logger.info('로그아웃 성공', { action: 'logout' });
  } catch (error) {
    logger.error('로그아웃 실패', error, { action: 'logout' });
    throw new AuthError('로그아웃에 실패했습니다.', 'LOGOUT_ERROR');
  }
};

/**
 * 현재 로그인된 사용자 가져오기
 */
export const getCurrentUser = (): Promise<User | null> => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        unsubscribe();
        try {
          if (firebaseUser) {
            const firestoreData = await fetchUserData(firebaseUser.uid);
            const user = mapFirebaseUserToUser(firebaseUser, firestoreData || undefined);
            resolve(user);
          } else {
            resolve(null);
          }
        } catch (error) {
          logger.error('현재 사용자 조회 실패', error, { action: 'getCurrentUser' });
          reject(new AuthError('사용자 정보를 가져오는데 실패했습니다.', 'GET_CURRENT_USER_ERROR'));
        }
      },
      (error) => {
        unsubscribe();
        logger.error('인증 상태 확인 실패', error, { action: 'getCurrentUser' });
        reject(new AuthError('인증 상태를 확인할 수 없습니다.', 'AUTH_STATE_ERROR'));
      }
    );
  });
};

// 진행 중인 인증 상태 요청 추적 (race condition 방지)
let inFlightAuthRequest: Promise<void> | null = null;

/**
 * 인증 상태 변경 리스너
 * Race condition 방지를 위해 순차 처리
 */
export const onAuthChange = (callback: (user: User | null) => void): (() => void) => {
  return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
    // 이전 요청이 완료될 때까지 대기
    if (inFlightAuthRequest) {
      await inFlightAuthRequest;
    }

    inFlightAuthRequest = (async () => {
      try {
        if (firebaseUser) {
          const firestoreData = await fetchUserData(firebaseUser.uid);
          const user = mapFirebaseUserToUser(firebaseUser, firestoreData || undefined);
          callback(user);
        } else {
          callback(null);
        }
      } catch (error) {
        logger.error('인증 상태 변경 처리 실패', error, { action: 'onAuthChange' });
        callback(null);
      }
    })();

    await inFlightAuthRequest;
    inFlightAuthRequest = null;
  });
};

/**
 * 사용자 역할 변경 (관리자 전용)
 * @throws {AuthError} 권한이 없는 경우
 */
export const setUserRole = async (
  userId: string,
  role: 'admin' | 'viewer',
  currentUser: User | null
): Promise<void> => {
  // 권한 검사
  if (!currentUser || currentUser.role !== 'admin') {
    logger.warn('권한 없는 역할 변경 시도', {
      action: 'setUserRole',
      targetUserId: userId,
      attemptedBy: currentUser?.id,
    });
    throw new AuthError('관리자만 역할을 변경할 수 있습니다.', 'PERMISSION_DENIED');
  }

  // 자기 자신의 역할 변경 방지
  if (userId === currentUser.id) {
    throw new AuthError('자신의 역할은 변경할 수 없습니다.', 'SELF_ROLE_CHANGE_ERROR');
  }

  try {
    const userDocRef = doc(db, collections.users, userId);
    await setDoc(userDocRef, { role }, { merge: true });
    logger.info('사용자 역할 변경', {
      action: 'setUserRole',
      targetUserId: userId,
      newRole: role,
      changedBy: currentUser.id,
    });
  } catch (error) {
    logger.error('역할 변경 실패', error, { action: 'setUserRole', targetUserId: userId });
    throw new AuthError('역할 변경에 실패했습니다.', 'SET_ROLE_ERROR');
  }
};

/**
 * 관리자 여부 확인
 */
export const isAdmin = (user: User | null): boolean => {
  return user?.role === 'admin';
};
