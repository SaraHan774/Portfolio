import type { WorkImage } from '../types';

/**
 * 업로드 완료된 이미지를 현재 이미지 목록에 병합한다.
 *
 * - temp(pending) 이미지는 업로드 결과(real)로 교체하되,
 *   사용자가 입력한 `order`/`caption`은 temp 이미지에서 그대로 승계한다.
 *   (real에는 caption 정보가 없으므로 승계하지 않으면 신규 업로드 이미지의 캡션이 소실된다)
 *   `blurDataURL`(LQIP)은 업로드 결과(real)에서 생성되므로 real 값을 사용한다.
 * - 업로드 실패한 temp 이미지는 목록에서 제거한다.
 * - 최종 목록은 order를 1부터 재정렬한다.
 * - 썸네일 ID가 temp였다면 실제 ID로 교체하고, 실패한 경우 첫 이미지로 대체한다.
 */
export const mergeUploadedImages = (
  currentImages: WorkImage[],
  uploadedMap: Map<string, WorkImage>,
  failedTempIds: Set<string>,
  currentThumbnailId: string
): { images: WorkImage[]; thumbnailId: string } => {
  const finalImages = currentImages
    .map((img) => {
      const real = uploadedMap.get(img.id);
      if (real) {
        // 업로드 결과(real)로 교체하되, 사용자 입력값(order/caption)은 temp 이미지에서 승계.
        // blurDataURL은 업로드 시 생성된 real 값을 그대로 유지(real을 먼저 펼쳐 보존).
        return { ...real, order: img.order, caption: img.caption };
      }
      // 업로드 실패한 pending 이미지는 제거
      if (failedTempIds.has(img.id)) {
        return null;
      }
      return img;
    })
    .filter((img): img is WorkImage => img !== null)
    .map((img, idx) => ({ ...img, order: idx + 1 }));

  let finalThumbnailId = currentThumbnailId;
  const realThumb = uploadedMap.get(currentThumbnailId);
  if (realThumb) {
    finalThumbnailId = realThumb.id;
  }
  if (failedTempIds.has(currentThumbnailId) && finalImages.length > 0) {
    finalThumbnailId = finalImages[0].id;
  }

  return { images: finalImages, thumbnailId: finalThumbnailId };
};
