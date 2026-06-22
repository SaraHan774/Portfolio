import type { CSSProperties } from 'react';

/**
 * 이미지 단위 캡션 스타일.
 * - 컨테이너(position: relative) 기준 absolute로 기존 이미지 간격 안에 표시 → 간격이 늘지 않음
 * - 이미지 아래 우측 정렬, 색/폰트는 기존 캡션·이메일 텍스트와 동일
 *
 * 메인 상세(WorkDetailPage 인라인 렌더)와 보조 모달(ModalImage)에서 공유한다.
 * 단일 소스로 두어 두 렌더 경로의 스타일이 어긋나지 않게 한다.
 */
const CAPTION_STYLE: CSSProperties = {
  position: 'absolute',
  top: '100%',
  right: 0,
  marginTop: '13px',
  marginBottom: 0,
  maxWidth: '100%',
  fontSize: 'var(--font-size-xs)',
  color: 'var(--color-gray-700)',
  lineHeight: 'var(--line-height-normal)',
  textAlign: 'right',
  whiteSpace: 'pre-wrap',
  pointerEvents: 'none',
};

interface ImageCaptionProps {
  /** 이미지 단위 캡션 텍스트 (선택값) */
  caption?: string;
}

/** 이미지 단위 캡션 — 빈 값이면 미출력. 상위 컨테이너는 position: relative 여야 한다. */
export default function ImageCaption({ caption }: ImageCaptionProps) {
  if (!caption) return null;
  return <p style={CAPTION_STYLE}>{caption}</p>;
}
