# Medium 이미지 로직 구현 계획

**작성일**: 2025-12-31
**목적**: Firebase 대역폭 비용 최적화 및 사용자 경험 개선

## 📋 목차

1. [배경 및 목표](#배경-및-목표)
2. [현재 상황 분석](#현재-상황-분석)
3. [구현 계획](#구현-계획)
4. [예상 효과](#예상-효과)
5. [롤백 계획](#롤백-계획)

---

## 배경 및 목표

### 문제점
- 작품 상세 페이지에서 10MB 원본 이미지를 직접 로드
- Firebase Blaze 요금제에서 트래픽 증가 시 대역폭 비용 급증
- 사용자 경험: 느린 이미지 로딩 속도

### 목표
- ✅ 대역폭 비용 80% 절감 (10MB → 2MB)
- ✅ 페이지 로딩 속도 5배 개선
- ✅ 고품질 원본 보존 (백업용)
- ✅ UX 유지 (Full HD 품질)

---

## 현재 상황 분석

### 이미지 처리 흐름

```
📤 업로드 (Admin)
└─ storageApi.uploadImage()
   ├─ 원본 (10MB max) → /works/originals/{id}.jpg
   └─ 썸네일 (300x300) → /works/thumbnails/{id}.jpg

📥 사용 (Front)
├─ 목록/카드: thumbnailUrl (300x300)
└─ 상세 페이지/모달: url (원본 10MB) ⚠️ 문제!
```

### 코드 위치

**Admin (업로드)**
- `src/data/api/storageApi.ts:51-114` - uploadImage()
- `src/core/constants/config.ts:29` - 이미지 설정
- `src/core/utils/image.ts:13` - resizeImage()

**Front (사용)**
- `app/works/[id]/page.tsx:474` - 작품 상세: `image.url` 사용
- `src/presentation/components/work/ModalImage.tsx:31` - 모달: `image.url` 사용
- `src/core/types/work.types.ts:6` - WorkImage 타입

---

## 구현 계획

### Phase 1: Admin - Medium 이미지 생성 (우선순위: 🔥 높음)

#### 1.1 타입 정의 업데이트

**파일**: `src/core/types/api.ts`

```typescript
export interface WorkImage {
  id: string;
  url: string;           // 원본 (백업용)
  thumbnailUrl: string;  // 썸네일 (300x300)
  mediumUrl?: string;    // 🆕 Medium 이미지 (1920x1920)
  listThumbnailUrl?: string;
  order: number;
  width: number;
  height: number;
  fileSize: number;
  uploadedFrom?: string;
}
```

#### 1.2 Config 업데이트

**파일**: `src/core/constants/config.ts`

```typescript
export const appConfig = {
  image: {
    maxFileSize: 10 * 1024 * 1024, // 10MB 유지
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],

    thumbnail: {
      maxWidth: 300,
      maxHeight: 300,
      quality: 0.7,
    },

    // 🆕 Medium 설정 추가
    medium: {
      maxWidth: 1920,   // Full HD
      maxHeight: 1920,
      quality: 0.85,    // 고품질 유지
    },
  },
  // ...
} as const;
```

#### 1.3 Storage API 수정

**파일**: `src/data/api/storageApi.ts`

**변경 내용**:
```typescript
export const uploadImage = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<WorkImage> => {
  const extension = validateFileExtension(file.name);
  const imageId = uuidv4();
  const fileName = `${imageId}.${extension}`;

  try {
    const dimensions = await getImageDimensions(file);

    // 1️⃣ 원본 업로드 (진행률 0-40%)
    const originalRef = ref(storage, `${storagePaths.worksOriginals}/${fileName}`);
    const uploadTask = uploadBytesResumable(originalRef, file);

    await new Promise<void>((resolve, reject) => {
      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 40;
          onProgress?.(progress);
        },
        reject,
        () => resolve()
      );
    });

    const originalUrl = await getDownloadURL(originalRef);

    // 2️⃣ 썸네일 생성 및 업로드 (진행률 40-70%)
    onProgress?.(40);
    const thumbnailBlob = await resizeImage(file, appConfig.image.thumbnail);
    const thumbnailRef = ref(storage, `${storagePaths.worksThumbnails}/${fileName}`);
    await uploadBytes(thumbnailRef, thumbnailBlob);
    const thumbnailUrl = await getDownloadURL(thumbnailRef);

    // 3️⃣ 🆕 Medium 이미지 생성 및 업로드 (진행률 70-100%)
    onProgress?.(70);
    const mediumBlob = await resizeImage(file, appConfig.image.medium);
    const mediumRef = ref(storage, `${storagePaths.worksMedium}/${fileName}`);
    await uploadBytes(mediumRef, mediumBlob);
    const mediumUrl = await getDownloadURL(mediumRef);
    onProgress?.(100);

    logger.info('이미지 업로드 성공 (원본+썸네일+Medium)', {
      action: 'uploadImage',
      imageId,
      fileName,
      originalSize: file.size,
      mediumSize: mediumBlob.size,
    });

    return {
      id: imageId,
      url: originalUrl,
      thumbnailUrl,
      mediumUrl,        // 🆕 추가
      order: 0,
      width: dimensions.width,
      height: dimensions.height,
      fileSize: file.size,
      uploadedFrom: 'desktop',
    };
  } catch (error) {
    logger.error('이미지 업로드 실패', error, { action: 'uploadImage', fileName });
    throw new UploadError('이미지 업로드에 실패했습니다.', { fileName });
  }
};
```

#### 1.4 Storage Path 추가

**파일**: `src/core/constants/paths.ts`

```typescript
export const storagePaths = {
  worksOriginals: 'works/originals',
  worksThumbnails: 'works/thumbnails',
  worksMedium: 'works/medium',      // 🆕 추가
  favicon: 'settings/favicon',
} as const;
```

#### 1.5 이미지 삭제 로직 업데이트

**파일**: `src/data/api/storageApi.ts`

```typescript
export const deleteImage = async (imageId: string, extension: string = 'jpg'): Promise<void> => {
  try {
    const fileName = `${imageId}.${extension}`;

    // 모든 버전 삭제
    await Promise.all([
      deleteObject(ref(storage, `${storagePaths.worksOriginals}/${fileName}`)),
      deleteObject(ref(storage, `${storagePaths.worksThumbnails}/${fileName}`)),
      deleteObject(ref(storage, `${storagePaths.worksMedium}/${fileName}`)),  // 🆕 추가
    ]);

    logger.info('이미지 삭제 성공', { action: 'deleteImage', imageId });
  } catch (error) {
    logger.error('이미지 삭제 실패', error, { action: 'deleteImage', imageId });
    throw new StorageError('이미지 삭제에 실패했습니다.', { imageId });
  }
};
```

---

### Phase 2: Front - Medium 이미지 사용 (우선순위: 🔥 높음)

#### 2.1 작품 상세 페이지 수정

**파일**: `/front/app/works/[id]/page.tsx`

**변경 전**:
```typescript
<FadeInImage
  src={item.data.url}        // ❌ 원본 (10MB)
  alt={work.title}
  width={item.data.width}
  height={item.data.height}
/>
```

**변경 후**:
```typescript
<FadeInImage
  src={item.data.mediumUrl || item.data.url}  // ✅ Medium 우선, 원본 폴백
  alt={work.title}
  width={item.data.width}
  height={item.data.height}
/>
```

#### 2.2 모달 이미지 수정

**파일**: `/front/src/presentation/components/work/ModalImage.tsx`

**변경 전**:
```typescript
<FadeInImage
  src={image.url}            // ❌ 원본
  alt={alt}
  width={image.width}
  height={image.height}
/>
```

**변경 후**:
```typescript
<FadeInImage
  src={image.mediumUrl || image.url}  // ✅ Medium 우선
  alt={alt}
  width={image.width}
  height={image.height}
/>
```

#### 2.3 타입 정의 동기화

**파일**: `/front/src/core/types/work.types.ts`

```typescript
export interface WorkImage {
  id: string;
  url: string;
  thumbnailUrl: string;
  mediumUrl?: string;        // 🆕 Optional (기존 데이터 호환)
  listThumbnailUrl?: string;
  webpUrl?: string;
  order: number;
  width: number;
  height: number;
}
```

---

### Phase 3: 테스트 및 검증

#### 3.1 Unit Tests

**파일**: `src/__tests__/data/api/storageApi.test.ts`

```typescript
describe('uploadImage with Medium', () => {
  it('should upload original, thumbnail, and medium images', async () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const result = await uploadImage(mockFile);

    expect(result.url).toBeDefined();
    expect(result.thumbnailUrl).toBeDefined();
    expect(result.mediumUrl).toBeDefined();  // 🆕 검증
  });

  it('should report progress correctly for 3 uploads', async () => {
    const progressValues: number[] = [];
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    await uploadImage(mockFile, (progress) => {
      progressValues.push(progress);
    });

    expect(Math.max(...progressValues)).toBe(100);
  });
});
```

#### 3.2 Integration Tests

**테스트 시나리오**:
1. ✅ 신규 이미지 업로드 → mediumUrl 생성 확인
2. ✅ 기존 이미지 (mediumUrl 없음) → 원본 폴백 확인
3. ✅ 이미지 삭제 → 3개 파일 모두 삭제 확인
4. ✅ Front 페이지 로딩 → mediumUrl 사용 확인

#### 3.3 수동 테스트 체크리스트

- [ ] Admin에서 10MB 이미지 업로드
  - [ ] Firebase Storage에 3개 파일 생성 확인
  - [ ] mediumUrl 필드가 Firestore에 저장되는지 확인
- [ ] Front 작품 상세 페이지
  - [ ] Network 탭에서 medium 이미지 로딩 확인 (2-3MB)
  - [ ] 이미지 품질이 Full HD 모니터에서 선명한지 확인
- [ ] 이미지 삭제
  - [ ] Firebase Storage에서 3개 파일 모두 삭제되는지 확인

---

### Phase 4: 기존 데이터 마이그레이션 (선택 사항)

#### 4.1 마이그레이션 스크립트

**파일**: `scripts/migrate-to-medium.ts` (새로 생성)

```typescript
import admin from 'firebase-admin';
import { resizeImage } from '../src/core/utils/image';
import { appConfig } from '../src/core/constants/config';

/**
 * 기존 이미지에 대해 Medium 버전 생성
 *
 * 주의: 비용이 발생하므로 필요한 경우만 실행
 */
async function migrateToMedium() {
  const db = admin.firestore();
  const storage = admin.storage();

  const worksSnapshot = await db.collection('works').get();
  let processed = 0;
  let errors = 0;

  for (const doc of worksSnapshot.docs) {
    const work = doc.data();

    if (!work.images || work.images.length === 0) continue;

    for (const image of work.images) {
      // mediumUrl이 이미 있으면 스킵
      if (image.mediumUrl) continue;

      try {
        console.log(`Processing image: ${image.id}`);

        // 원본 다운로드
        const [originalFile] = await storage
          .bucket()
          .file(`works/originals/${image.id}.jpg`)
          .download();

        // Medium 생성
        const blob = new Blob([originalFile]);
        const file = new File([blob], `${image.id}.jpg`, { type: 'image/jpeg' });
        const mediumBlob = await resizeImage(file, appConfig.image.medium);

        // Medium 업로드
        await storage
          .bucket()
          .file(`works/medium/${image.id}.jpg`)
          .save(Buffer.from(await mediumBlob.arrayBuffer()));

        const mediumUrl = await storage
          .bucket()
          .file(`works/medium/${image.id}.jpg`)
          .publicUrl();

        // Firestore 업데이트
        image.mediumUrl = mediumUrl;
        processed++;

      } catch (error) {
        console.error(`Failed to process image ${image.id}:`, error);
        errors++;
      }
    }

    // Firestore 업데이트
    await doc.ref.update({ images: work.images });
  }

  console.log(`✅ Migration complete: ${processed} processed, ${errors} errors`);
}

// 실행 확인
if (process.argv.includes('--confirm')) {
  migrateToMedium();
} else {
  console.log('❌ Add --confirm flag to run migration');
  console.log('⚠️  Warning: This will incur Firebase costs for processing existing images');
}
```

**실행 방법**:
```bash
# Dry run (실행 안함)
npm run migrate:medium

# 실제 실행
npm run migrate:medium -- --confirm
```

**참고**:
- 기존 이미지가 적다면 수동으로 재업로드하는 것이 더 간단
- 마이그레이션은 Firebase 비용 발생 (기존 이미지 다운로드 + 신규 업로드)

---

## 예상 효과

### 비용 절감

**Before (현재)**
```
월 방문자 1,000명 × 작품 10개 × 10MB = 100GB
→ $0.12/GB × 100GB = $12/월
```

**After (개선 후)**
```
월 방문자 1,000명 × 작품 10개 × 2MB = 20GB
→ $0.12/GB × 20GB = $2.4/월
```

**절감액**: $9.6/월 (80% 절감) 💰

### 성능 개선

| 메트릭 | Before | After | 개선율 |
|-------|--------|-------|--------|
| 이미지 크기 | 10MB | 2MB | 80% ↓ |
| 로딩 시간 (4G) | ~8초 | ~1.6초 | 5배 ↑ |
| LCP (Largest Contentful Paint) | 8-10초 | 2-3초 | 70% ↓ |

### 사용자 경험

- ✅ 페이지 로딩 체감 속도 5배 향상
- ✅ 모바일 데이터 사용량 80% 감소
- ✅ Full HD 품질 유지 (1920px)
- ✅ 원본 보존으로 미래 확장성 확보

---

## 롤백 계획

### 롤백 시나리오

만약 문제가 발생하면:

**1. Front만 롤백 (빠름)**
```typescript
// 원본으로 되돌리기
<FadeInImage
  src={item.data.url}  // mediumUrl 제거
  alt={work.title}
/>
```

**2. Admin 롤백 (중간)**
```typescript
// Medium 생성 코드 주석 처리
// const mediumBlob = await resizeImage(file, appConfig.image.medium);
// const mediumRef = ref(storage, `${storagePaths.worksMedium}/${fileName}`);
// ...
```

**3. 전체 롤백 (느림)**
- Git revert로 이전 커밋 복원
- 이미 생성된 Medium 파일은 수동 삭제 필요

### 모니터링 지표

배포 후 다음 지표 확인:
- [ ] Firebase Storage 사용량 증가 (Medium 파일 추가로 약 20% 증가 예상)
- [ ] Firebase 대역폭 사용량 감소 (70-80% 감소 예상)
- [ ] 페이지 로딩 시간 (Google Analytics Core Web Vitals)
- [ ] 에러 로그 (mediumUrl 로딩 실패 등)

---

## 구현 타임라인

### Week 1: Admin 구현
- Day 1-2: Phase 1.1 ~ 1.4 구현
- Day 3: Phase 1.5 삭제 로직 구현
- Day 4-5: Unit Tests 작성 및 수동 테스트

### Week 2: Front 구현
- Day 1: Phase 2.1 ~ 2.3 구현
- Day 2: Integration Tests
- Day 3: 통합 테스트 및 QA

### Week 3: 배포 및 모니터링
- Day 1: Staging 환경 배포
- Day 2-3: Production 배포
- Day 4-7: 모니터링 및 이슈 대응

### (선택) Week 4: 마이그레이션
- 기존 데이터가 많고 필요한 경우만 진행

---

## 참고 자료

### 관련 파일

**Admin**
- `src/data/api/storageApi.ts` - 이미지 업로드 로직
- `src/core/constants/config.ts` - 이미지 설정
- `src/core/constants/paths.ts` - Storage 경로
- `src/core/utils/image.ts` - 이미지 리사이징 유틸
- `src/core/types/api.ts` - WorkImage 타입

**Front**
- `app/works/[id]/page.tsx` - 작품 상세 페이지
- `src/presentation/components/work/ModalImage.tsx` - 이미지 모달
- `src/core/types/work.types.ts` - WorkImage 타입

### Firebase 문서
- [Cloud Storage Pricing](https://firebase.google.com/pricing)
- [Storage Best Practices](https://firebase.google.com/docs/storage/best-practices)
- [Image Optimization](https://web.dev/optimize-images/)

---

**작성자**: Claude Code
**마지막 업데이트**: 2025-12-31
**버전**: 1.0
