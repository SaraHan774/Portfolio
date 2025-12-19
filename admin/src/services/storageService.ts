/**
 * Storage Service - 스토리지 서비스
 *
 * @deprecated 이 파일은 후방 호환성을 위해 유지됩니다.
 * 새로운 코드에서는 data/repository를 직접 import하세요.
 *
 * @example
 * // 권장하는 방식
 * import { uploadImage, deleteWorkImages } from '../data/repository';
 *
 * // 기존 방식 (호환성 유지)
 * import { uploadImage, deleteWorkImages } from '../services/storageService';
 */
export {
  uploadImage,
  uploadImages,
  deleteImage,
  deleteWorkImages,
} from '../data/repository';

// Storage-specific exports from API
export {
  listWorkImages,
  refreshImageUrl,
} from '../data/api/storageApi';
