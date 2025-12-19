/**
 * Works Service - 작품 서비스
 *
 * @deprecated 이 파일은 후방 호환성을 위해 유지됩니다.
 * 새로운 코드에서는 data/repository를 직접 import하세요.
 *
 * @example
 * // 권장하는 방식
 * import { getWorks, createWork } from '../data/repository';
 *
 * // 기존 방식 (호환성 유지)
 * import { getWorks, createWork } from '../services/worksService';
 */
export {
  getWorks,
  getPublishedWorks,
  getWork,
  createWork,
  updateWork,
  deleteWork,
  incrementViewCount,
  uploadImage,
  uploadImages,
  deleteImage,
  deleteWorkImages,
  worksCacheKeys,
  worksCacheConfig,
} from '../data/repository';
