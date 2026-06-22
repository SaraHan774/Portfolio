import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ImageUploader from '../../components/ImageUploader';
import type { WorkImage } from '../../core/types';

// antd message만 모킹 (나머지는 실제 컴포넌트 사용)
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd');
  return {
    ...actual,
    message: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
  };
});

const image: WorkImage = {
  id: 'img-1',
  url: 'https://example.com/a.jpg',
  thumbnailUrl: 'https://example.com/a-t.jpg',
  order: 0,
  width: 800,
  height: 600,
};

describe('ImageUploader 캡션 편집', () => {
  it('모달에서 캡션 입력 후 확인하면 onChange로 caption이 반영된다', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ImageUploader value={[image]} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: /캡션 편집/ }));
    const textarea = await screen.findByPlaceholderText(/사진 캡션/);
    await user.type(textarea, '사진_XXX');
    await user.click(screen.getByRole('button', { name: '확인' }));

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ id: 'img-1', caption: '사진_XXX' })])
      );
    });
  });

  it('취소하면 캡션이 반영되지 않는다', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ImageUploader value={[image]} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: /캡션 편집/ }));
    const textarea = await screen.findByPlaceholderText(/사진 캡션/);
    await user.type(textarea, '버려질 캡션');
    await user.click(screen.getByRole('button', { name: '취소' }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it('기존 캡션은 카드에 미리보기로 표시된다', () => {
    render(<ImageUploader value={[{ ...image, caption: '사진_XXX' }]} onChange={vi.fn()} />);
    expect(screen.getByText('사진_XXX')).toBeInTheDocument();
  });

  it('캡션이 없으면 "캡션 없음"을 표시한다', () => {
    render(<ImageUploader value={[image]} onChange={vi.fn()} />);
    expect(screen.getByText('캡션 없음')).toBeInTheDocument();
  });
});
