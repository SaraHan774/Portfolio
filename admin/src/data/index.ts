/**
 * Data Layer - 데이터 레이어 진입점
 *
 * 계층 구조:
 * - api/: Firebase 직접 접근 (Firestore, Auth, Storage)
 * - mappers/: 데이터 변환 (Firestore ↔ Domain models)
 * - repository/: API 래핑 + 캐싱 로직 (도메인에서 사용)
 *
 * 외부에서는 repository만 import하여 사용 권장
 */

// Repository (권장 - 캐싱 로직 포함)
export * from './repository';

// API (직접 접근 필요시)
export * as worksApi from './api/worksApi';
export * as authApi from './api/authApi';
export * as categoriesApi from './api/categoriesApi';
export * as settingsApi from './api/settingsApi';
export * as storageApi from './api/storageApi';

// Mappers (커스텀 변환 필요시)
export * from './mappers';
