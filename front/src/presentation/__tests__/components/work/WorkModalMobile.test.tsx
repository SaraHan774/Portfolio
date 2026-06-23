/**
 * WorkModalMobile 동작 보증 테스트
 *
 * 리팩토링 전/후 동일한 동작을 보장합니다.
 * 모바일 모달의 핵심 동작을 명세합니다.
 * WorkModal과 공유되는 동작을 포함하여, 리팩토링 후에도 동일한 결과를 보장합니다.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import WorkModalMobile from '../../../components/work/WorkModalMobile';
import type { Work } from '@/core/types';

// ────────────────────────────────────────────────────────────────
// Mocks
// ────────────────────────────────────────────────────────────────

const mockClearHover = vi.fn();
const mockUseWork = vi.fn();
const mockUseCaptionHoverEvents = vi.fn();
const mockUseModalLinkHandler = vi.fn();
const mockUseImageTracker = vi.fn((_ref: unknown, _work: unknown, _id: unknown) => ({
  currentImageId: null,
  setCurrentImageId: vi.fn(),
}));

const mockPrefetchWork = vi.fn();

vi.mock('@/domain', () => ({
  useWork: (id: string) => mockUseWork(id),
  usePrefetchWork: () => mockPrefetchWork,
  useCaptionHoverEvents: (opts: unknown) => mockUseCaptionHoverEvents(opts),
  useModalLinkHandler: (onWorkClick: unknown, clearHover: unknown) =>
    mockUseModalLinkHandler(onWorkClick, clearHover),
  useImageTracker: (ref: unknown, work: unknown, id: unknown) => {
    mockUseImageTracker(ref, work, id);
    return { currentImageId: null, setCurrentImageId: vi.fn() };
  },
}));

vi.mock('body-scroll-lock', () => ({
  disableBodyScroll: vi.fn(),
  enableBodyScroll: vi.fn(),
  clearAllBodyScrollLocks: vi.fn(),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      onClick,
      onWheel,
      onTouchMove,
      className,
      style,
    }: React.HTMLAttributes<HTMLDivElement>) => (
      <div onClick={onClick} onWheel={onWheel} onTouchMove={onTouchMove} className={className} style={style}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/presentation', () => ({
  Spinner: () => <div data-testid="spinner" />,
}));

vi.mock('@/core/utils', () => ({
  getMediaItems: vi.fn(() => []),
}));

vi.mock('../../../components/media', () => ({
  YouTubeEmbed: () => <div data-testid="youtube-embed" />,
}));

vi.mock('../../../components/work/ModalImage', () => ({
  default: () => <div data-testid="modal-image" />,
}));

vi.mock('../../../components/work/FloatingWorkWindow', () => ({
  default: () => <div data-testid="floating-window" />,
}));

// ────────────────────────────────────────────────────────────────
// 공통 fixtures
// ────────────────────────────────────────────────────────────────

const mockWork: Work = {
  id: 'work-mobile-1',
  title: '모바일 테스트 작품',
  year: 2023,
  fullDescription: '모바일 설명',
  thumbnailImageId: 'img-1',
  images: [],
  sentenceCategoryIds: [],
  exhibitionCategoryIds: [],
  isPublished: true,
  publishedAt: new Date('2023-06-01'),
  createdAt: new Date('2023-06-01'),
  updatedAt: new Date('2023-06-01'),
  caption: '모바일 캡션',
};

const defaultProps = {
  workId: 'work-mobile-1',
  onClose: vi.fn(),
  onWorkClick: vi.fn(),
  renderCaption: vi.fn((_caption, captionId) => <div id={captionId}>캡션 내용</div>),
};

beforeEach(() => {
  vi.clearAllMocks();

  mockUseWork.mockReturnValue({
    data: mockWork,
    isLoading: false,
    isError: false,
    error: null,
  });

  mockUseCaptionHoverEvents.mockReturnValue({
    hoveredWorkId: null,
    hoverPosition: null,
    clearHover: mockClearHover,
  });
});

// ────────────────────────────────────────────────────────────────
// 로딩 상태
// ────────────────────────────────────────────────────────────────
describe('WorkModalMobile - 로딩 상태', () => {
  it('isLoading=true 일 때 Spinner를 렌더링한다', () => {
    mockUseWork.mockReturnValue({ data: undefined, isLoading: true, isError: false });

    render(<WorkModalMobile {...defaultProps} />);

    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('data가 없을 때 Spinner를 렌더링한다', () => {
    mockUseWork.mockReturnValue({ data: undefined, isLoading: false, isError: false });

    render(<WorkModalMobile {...defaultProps} />);

    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('데이터가 있을 때 Spinner가 없다', () => {
    render(<WorkModalMobile {...defaultProps} />);

    expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
  });
});

// ────────────────────────────────────────────────────────────────
// 에러 처리
// ────────────────────────────────────────────────────────────────
describe('WorkModalMobile - 에러 처리', () => {
  it('isError=true 일 때 onClose를 호출한다', async () => {
    const onClose = vi.fn();
    mockUseWork.mockReturnValue({ data: undefined, isLoading: false, isError: true });

    render(<WorkModalMobile {...defaultProps} onClose={onClose} />);

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('에러가 없을 때 onClose를 자동으로 호출하지 않는다', () => {
    const onClose = vi.fn();
    render(<WorkModalMobile {...defaultProps} onClose={onClose} />);

    expect(onClose).not.toHaveBeenCalled();
  });
});

// ────────────────────────────────────────────────────────────────
// 작품 정보 렌더링 (데스크톱과 동일한 포맷 보장)
// ────────────────────────────────────────────────────────────────
describe('WorkModalMobile - 작품 정보 렌더링', () => {
  it('작품 제목을 렌더링한다', () => {
    render(<WorkModalMobile {...defaultProps} />);

    expect(screen.getByText(/모바일 테스트 작품/)).toBeInTheDocument();
  });

  it('작품 제목과 연도를 "제목, 연도" 형식으로 렌더링한다', () => {
    render(<WorkModalMobile {...defaultProps} />);

    expect(screen.getByText(/모바일 테스트 작품,\s*2023/)).toBeInTheDocument();
  });

  it('연도가 없을 때 제목만 렌더링한다', () => {
    mockUseWork.mockReturnValue({
      data: { ...mockWork, year: undefined },
      isLoading: false,
      isError: false,
    });

    render(<WorkModalMobile {...defaultProps} />);

    const heading = screen.getByRole('heading');
    expect(heading.textContent).not.toContain(',');
    expect(heading.textContent).toContain('모바일 테스트 작품');
  });

  it('캡션이 있을 때 renderCaption을 호출한다', () => {
    const renderCaption = vi.fn(() => <div>캡션</div>);
    render(<WorkModalMobile {...defaultProps} renderCaption={renderCaption} />);

    expect(renderCaption).toHaveBeenCalledWith(
      mockWork.caption,
      `modal-${mockWork.id}`,
      true
    );
  });

  it('캡션이 없을 때 renderCaption을 호출하지 않는다', () => {
    const renderCaption = vi.fn(() => <div>캡션</div>);
    mockUseWork.mockReturnValue({
      data: { ...mockWork, caption: undefined },
      isLoading: false,
      isError: false,
    });

    render(<WorkModalMobile {...defaultProps} renderCaption={renderCaption} />);

    expect(renderCaption).not.toHaveBeenCalled();
  });
});

// ────────────────────────────────────────────────────────────────
// 닫기 버튼
// ────────────────────────────────────────────────────────────────
describe('WorkModalMobile - 닫기 버튼', () => {
  it('닫기 버튼(×) 클릭 시 onClose를 호출한다', () => {
    const onClose = vi.fn();
    render(<WorkModalMobile {...defaultProps} onClose={onClose} />);

    fireEvent.click(screen.getByText('×'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

// ────────────────────────────────────────────────────────────────
// 링크 클릭 이벤트 위임
//
// 리팩토링 후: 링크 클릭 처리는 useModalLinkHandler hook으로 분리됨.
// WorkModal과 동일하게 hook을 올바른 인자로 호출하는지 검증합니다.
// 실제 링크 클릭 동작은 useModalLinkHandler.test.ts에서 검증합니다.
// ────────────────────────────────────────────────────────────────
describe('WorkModalMobile - 링크 클릭 이벤트 위임', () => {
  it('useModalLinkHandler를 onWorkClick과 clearHover로 호출한다', () => {
    const onWorkClick = vi.fn();
    render(<WorkModalMobile {...defaultProps} onWorkClick={onWorkClick} />);
    expect(mockUseModalLinkHandler).toHaveBeenCalledWith(onWorkClick, mockClearHover);
  });
});

// ────────────────────────────────────────────────────────────────
// workId 변경 시 hover 초기화
// ────────────────────────────────────────────────────────────────
describe('WorkModalMobile - workId 변경', () => {
  it('workId가 변경될 때 clearHover를 호출한다', () => {
    const { rerender } = render(<WorkModalMobile {...defaultProps} workId="work-mobile-1" />);

    rerender(<WorkModalMobile {...defaultProps} workId="work-mobile-2" />);

    expect(mockClearHover).toHaveBeenCalled();
  });
});

// ────────────────────────────────────────────────────────────────
// 스크롤 레이아웃 구조 (모바일 전용)
// ────────────────────────────────────────────────────────────────
describe('WorkModalMobile - 모바일 전용 레이아웃', () => {
  it('스크롤 컨테이너가 존재한다 (mobile-modal-scroll)', () => {
    render(<WorkModalMobile {...defaultProps} />);

    expect(document.querySelector('.mobile-modal-scroll')).toBeInTheDocument();
  });

  it('모달 오버레이 내부(modal-content) 클릭은 onClose를 호출하지 않는다', () => {
    const onClose = vi.fn();
    render(<WorkModalMobile {...defaultProps} onClose={onClose} />);

    // modal-content 클릭은 stopPropagation되어 오버레이 핸들러까지 도달하지 않음
    const content = document.querySelector('.modal-content') as HTMLElement;
    fireEvent.click(content);

    // modal-content에서 stopPropagation하므로 오버레이의 onClose가 호출되지 않아야 함
    expect(onClose).not.toHaveBeenCalled();
  });
});
