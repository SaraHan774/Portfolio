import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ModalImage from '../../../components/work/ModalImage';
import type { WorkImage } from '@/types';

// 의존 컴포넌트는 패스스루로 모킹 (캡션 렌더 로직만 검증)
vi.mock('@/presentation/ui', () => ({
  // eslint-disable-next-line @next/next/no-img-element
  FadeInImage: (props: { alt: string }) => <img alt={props.alt} />,
}));
vi.mock('@/presentation/components/media', () => ({
  ZoomableImage: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const baseImage: WorkImage = {
  id: 'img-1',
  url: 'https://example.com/a.jpg',
  thumbnailUrl: 'https://example.com/a-t.jpg',
  order: 0,
  width: 800,
  height: 600,
};

describe('ModalImage 캡션 렌더', () => {
  it('캡션이 있으면 텍스트를 표시한다', () => {
    render(<ModalImage image={{ ...baseImage, caption: '사진_XXX' }} alt="작품" isLast={false} />);
    expect(screen.getByText('사진_XXX')).toBeInTheDocument();
  });

  it('캡션이 없으면 캡션 문단을 렌더하지 않는다', () => {
    const { container } = render(<ModalImage image={baseImage} alt="작품" isLast={false} />);
    expect(container.querySelector('p')).toBeNull();
  });

  it('캡션이 빈 문자열이면 렌더하지 않는다', () => {
    const { container } = render(<ModalImage image={{ ...baseImage, caption: '' }} alt="작품" isLast={false} />);
    expect(container.querySelector('p')).toBeNull();
  });
});
