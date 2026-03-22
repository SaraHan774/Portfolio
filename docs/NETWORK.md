# NETWORK.md: 네트워크 I/O 효율화

이 프로젝트는 REST API 없이 **Firebase SDK**로 직접 Firestore/Storage에 접근합니다.

---

## 1. Firebase 데이터 접근

### 1.1 Firestore 읽기

```typescript
// data/api/worksApi.ts
import { collection, getDocs, doc, getDoc, query, where, orderBy } from 'firebase/firestore';
import { getDb } from './client';

export const worksApi = {
  async getAll(): Promise<WorkDocument[]> {
    const db = getDb();
    const snapshot = await getDocs(
      query(collection(db, 'works'), orderBy('order', 'asc'))
    );
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as WorkDocument));
  },

  async getPublished(): Promise<WorkDocument[]> {
    const db = getDb();
    const snapshot = await getDocs(
      query(collection(db, 'works'), where('published', '==', true))
    );
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as WorkDocument));
  },
};
```

### 1.2 Firestore 쓰기 (admin)

```typescript
// data/api/worksApi.ts (admin)
export const worksApi = {
  async create(payload: CreateWorkPayload): Promise<string> {
    const db = getDb();
    const ref = await addDoc(collection(db, 'works'), {
      ...payload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  },

  async update(id: string, payload: Partial<WorkDocument>): Promise<void> {
    const db = getDb();
    await updateDoc(doc(db, 'works', id), {
      ...payload,
      updatedAt: serverTimestamp(),
    });
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, 'works', id));
  },
};
```

### 1.3 Firebase Storage 업로드 (admin)

```typescript
// data/api/storageApi.ts
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export const storageApi = {
  async upload(path: string, file: File): Promise<string> {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  },

  async delete(url: string): Promise<void> {
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
  },
};
```

---

## 2. TanStack Query 캐싱 전략

### 2.1 Query Key 중앙 관리

```typescript
// data/cache/queryKeys.ts
export const queryKeys = {
  works: {
    all: ['works'] as const,
    byId: (id: string) => ['works', id] as const,
    published: ['works', 'published'] as const,
  },
  categories: {
    all: ['categories'] as const,
    sentences: ['categories', 'sentences'] as const,
    exhibitions: ['categories', 'exhibitions'] as const,
  },
  settings: {
    site: ['settings', 'site'] as const,
  },
};
```

### 2.2 staleTime / gcTime 기준

| 데이터 | staleTime | gcTime | 이유 |
|--------|-----------|--------|------|
| Works (front) | 5분 | 10분 | 자주 안 바뀜 |
| Categories | 10분 | 20분 | 거의 안 바뀜 |
| Site Settings | 10분 | 20분 | 거의 안 바뀜 |
| Works (admin) | 0~1분 | 5분 | 편집 중이므로 최신 유지 |
| Analytics | 1분 | 3분 | 실시간성 필요 |

```typescript
// ✅ 예시: 변경 빈도에 따라 설정
export function useWorks() {
  return useQuery({
    queryKey: queryKeys.works.published,
    queryFn: () => workRepository.getPublished(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
```

### 2.3 요청 중복 제거

TanStack Query는 동일한 `queryKey`에 대해 동시 요청을 자동으로 1개로 통합합니다.

```typescript
// 여러 컴포넌트에서 동시 호출해도 Firestore 요청은 1번만
const a = useWorks(); // Firestore 호출
const b = useWorks(); // 캐시 사용
```

### 2.4 Mutation 후 캐시 무효화

```typescript
export function useDeleteWork() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => workRepository.delete(id),
    onSuccess: () => {
      // 관련 캐시 무효화 → 자동 재조회
      queryClient.invalidateQueries({ queryKey: queryKeys.works.all });
    },
  });
}
```

---

## 3. 이미지/파일 업로드 최적화 (admin)

### 3.1 병렬 업로드

```typescript
// domain/hooks/useUploadImages.ts
export function useUploadImages() {
  return useMutation({
    mutationFn: async (files: File[]) => {
      // 병렬 업로드 (Promise.all)
      const urls = await Promise.all(
        files.map((file, i) =>
          storageApi.upload(`works/${Date.now()}_${i}`, file)
        )
      );
      return urls;
    },
  });
}
```

### 3.2 업로드 진행률 추적

```typescript
import { uploadBytesResumable } from 'firebase/storage';

export function uploadWithProgress(
  path: string,
  file: File,
  onProgress: (percent: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, path);
    const task = uploadBytesResumable(storageRef, file);

    task.on(
      'state_changed',
      snapshot => {
        const percent = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress(Math.round(percent));
      },
      reject,
      async () => resolve(await getDownloadURL(task.snapshot.ref))
    );
  });
}
```

---

## 4. 오류 처리 및 재시도

### 4.1 TanStack Query 자동 재시도

```typescript
// ✅ Firestore 일시적 오류에 대한 재시도
const query = useQuery({
  queryKey: queryKeys.works.all,
  queryFn: () => workRepository.getAll(),
  retry: 2,
  retryDelay: attempt => Math.min(1000 * 2 ** attempt, 10000),
});
```

### 4.2 Firestore 에러 처리

```typescript
import { FirebaseError } from 'firebase/app';

export async function safeFirestoreCall<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof FirebaseError) {
      switch (error.code) {
        case 'permission-denied':
          throw new AppError('권한이 없습니다.', error.code);
        case 'unavailable':
          throw new AppError('서버에 연결할 수 없습니다. 다시 시도해주세요.', error.code);
        default:
          throw new AppError(`Firebase 오류: ${error.message}`, error.code);
      }
    }
    throw error;
  }
}
```

---

## 5. Firebase Emulator 연결

로컬 개발 시 실제 Firebase 대신 Emulator 사용.

```typescript
// front: data/api/client.ts
if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectStorageEmulator(storage, 'localhost', 9199);
}

// admin: config/firebase.ts
if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectStorageEmulator(storage, 'localhost', 9199);
}
```

---

## 체크리스트

- [ ] `queryKeys.ts`에 키 중앙화 (중복 방지)
- [ ] `staleTime` / `gcTime` 데이터 특성에 맞게 설정
- [ ] Mutation 후 `invalidateQueries` 호출
- [ ] 이미지 업로드 병렬화 (Promise.all)
- [ ] FirebaseError 코드별 사용자 메시지 처리
- [ ] 로컬 개발 시 Emulator 사용

---

**더 보기**: `docs/SECURITY.md`, `docs/PERFORMANCE.md`
