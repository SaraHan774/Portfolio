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
}

export default function ModalImage({ image, alt, isLast }: ModalImageProps) {
  return (
    <div
      data-image-id={image.id}
      style={{
        marginBottom: isLast ? 0 : 'var(--space-8)',
        position: 'relative',
        width: '100%',
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

