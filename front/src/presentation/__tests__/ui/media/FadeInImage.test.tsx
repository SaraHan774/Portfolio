import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import FadeInImage from '../../../ui/media/FadeInImage';

// next/image를 단순 img로 모킹하되, 전달된 placeholder/blurDataURL을 data 속성으로 노출
vi.mock('next/image', () => ({
  default: (props: {
    src: string;
    alt: string;
    placeholder?: string;
    blurDataURL?: string;
    onLoad?: () => void;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={props.src}
      alt={props.alt}
      data-placeholder={props.placeholder ?? ''}
      data-blur={props.blurDataURL ?? ''}
    />
  ),
}));

const baseProps = {
  src: 'https://example.com/a.jpg',
  alt: '작품 이미지',
  width: 800,
  height: 600,
};

describe('FadeInImage - LQIP 블러 분기', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('blurDataURL이 있으면 placeholder="blur"로 렌더한다', () => {
    render(<FadeInImage {...baseProps} blurDataURL="data:image/webp;base64,AAAA" />);
    const img = screen.getByRole('img', { name: '작품 이미지' });
    expect(img.getAttribute('data-placeholder')).toBe('blur');
    expect(img.getAttribute('data-blur')).toBe('data:image/webp;base64,AAAA');
  });

  it('blurDataURL이 있으면 일정 시간이 지나도 스켈레톤을 표시하지 않는다', () => {
    const { container } = render(
      <FadeInImage {...baseProps} blurDataURL="data:image/webp;base64,AAAA" />
    );
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(container.querySelector('.skeleton-shimmer')).toBeNull();
  });

  it('blurDataURL이 없으면 placeholder를 설정하지 않고 일정 시간 후 스켈레톤을 표시한다', () => {
    const { container } = render(<FadeInImage {...baseProps} />);
    const img = screen.getByRole('img', { name: '작품 이미지' });
    expect(img.getAttribute('data-placeholder')).toBe('');

    expect(container.querySelector('.skeleton-shimmer')).toBeNull();
    act(() => {
      vi.advanceTimersByTime(1300);
    });
    expect(container.querySelector('.skeleton-shimmer')).not.toBeNull();
  });
});
