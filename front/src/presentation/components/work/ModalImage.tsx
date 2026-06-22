'use client';

/**
 * 모달 내 이미지 컴포넌트
 * FadeInImage를 래핑하여 모달에 적합한 스타일 적용
 */

import { FadeInImage } from '@/presentation/ui';
import { ZoomableImage } from '@/presentation/components/media';
import type { WorkImage } from '@/types';

interface ModalImageProps {
  /** 이미지 정보 객체 */
  image: WorkImage;
  /** 이미지 대체 텍스트 */
  alt: string;
  /** 마지막 이미지 여부 (하단 마진 결정) */
  isLast: boolean;
  /** 커스텀 하단 마진 (optional, 기본값: var(--space-8)) */
  marginBottom?: string;
  /**
   * 반응형 이미지 크기 힌트 (next/image sizes).
   * 모바일은 viewport 전체 폭, 데스크톱은 이미지 컬럼 폭(~60vw) 기준 변형을 수신
   */
  sizes?: string;
  /** 우선 로딩 여부 (모달 첫 이미지 등 LCP 후보에 사용) */
  priority?: boolean;
  /** 이미지 품질 (next/image quality). 미지정 시 모달 기본값(72) */
  quality?: number;
}

const DEFAULT_MODAL_IMAGE_SIZES = '(max-width: 768px) 100vw, 60vw';
/** 모달 본문 이미지 품질 — 화질 보존 우선의 보수적 값. 줌(원본)에는 영향 없음 */
const DEFAULT_MODAL_IMAGE_QUALITY = 72;

export default function ModalImage({
  image,
  alt,
  isLast,
  marginBottom = 'var(--space-8)',
  sizes = DEFAULT_MODAL_IMAGE_SIZES,
  priority = false,
  quality = DEFAULT_MODAL_IMAGE_QUALITY,
}: ModalImageProps) {
  return (
    <div
      data-image-id={image.id}
      style={{
        // 모달에서는 이미지 단위 캡션을 표시하지 않으므로 마지막 이미지 하단 여백 불필요.
        marginBottom: isLast ? 0 : marginBottom,
        position: 'relative',
        width: '100%',
        // inline-block 이미지 아래 descender 공백 제거
        lineHeight: 0,
      }}
    >
      <ZoomableImage
        imageData={{
          src: image.url,
          alt,
          width: image.width,
          height: image.height,
        }}
      >
        <FadeInImage
          src={image.url}
          alt={alt}
          width={image.width}
          height={image.height}
          sizes={sizes}
          priority={priority}
          quality={quality}
          style={{
            width: '100%',
            height: 'auto',
            borderRadius: '4px',
          }}
        />
      </ZoomableImage>
    </div>
  );
}

