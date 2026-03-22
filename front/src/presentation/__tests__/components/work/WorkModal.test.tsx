/**
 * WorkModal 동작 보증 테스트
 *
 * 리팩토링 전/후 동일한 동작을 보장합니다.
 * 데스크톱 모달의 핵심 동작을 명세합니다.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import WorkModal from '../../../components/work/WorkModal';
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

vi.mock('@/domain', () => ({
  useWork: (id: string) => mockUseWork(id),
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

vi.mock('overlayscrollbars-react', () => ({
  OverlayScrollbarsComponent: ({
    children,
    events,
  }: {
    children: React.ReactNode;
    events?: { initialized?: (instance: unknown) => void };
  }) => {
    // initialized 콜백을 즉시 호출 (viewport mock 포함)
    if (events?.initialized) {
      events.initialized({
        elements: () => ({ viewport: document.createElement('div') }),
      });
    }
    return <div data-testid="overlay-scrollbars">{children}</div>;
  },
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, onClick, onWheel, onTouchMove, className, style }: React.HTMLAttributes<HTMLDivElement>) => (
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

vi.mock('overlayscrollbars/overlayscrollbars.css', () => ({}));

// ────────────────────────────────────────────────────────────────
// 공통 fixtures
// ────────────────────────────────────────────────────────────────

const mockWork: Work = {
  id: 'work-1',
  title: '테스트 작품',
  year: 2024,
  fullDescription: '설명',
  thumbnailImageId: 'img-1',
  images: [],
  sentenceCategoryIds: [],
  exhibitionCategoryIds: [],
  isPublished: true,
  publishedAt: new Date('2024-01-01'),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  caption: '작품 캡션',
};

const defaultProps = {
  workId: 'work-1',
  onClose: vi.fn(),
  onWorkClick: vi.fn(),
  renderCaption: vi.fn((_caption, captionId) => <div id={captionId}>캡션 내용</div>),
};

beforeEach(() => {
  vi.clearAllMocks();

  // 기본: 로딩 완료 + 데이터 있음
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
describe('WorkModal - 로딩 상태', () => {
  it('isLoading=true 일 때 Spinner를 렌더링한다', () => {
    mockUseWork.mockReturnValue({ data: undefined, isLoading: true, isError: false });

    render(<WorkModal {...defaultProps} />);

    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('data가 없을 때 Spinner를 렌더링한다', () => {
    mockUseWork.mockReturnValue({ data: undefined, isLoading: false, isError: false });

    render(<WorkModal {...defaultProps} />);

    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('데이터가 있을 때 Spinner가 없다', () => {
    render(<WorkModal {...defaultProps} />);

    expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
  });
});

// ────────────────────────────────────────────────────────────────
// 에러 처리
// ────────────────────────────────────────────────────────────────
describe('WorkModal - 에러 처리', () => {
  it('isError=true 일 때 onClose를 호출한다', async () => {
    const onClose = vi.fn();
    mockUseWork.mockReturnValue({ data: undefined, isLoading: false, isError: true });

    render(<WorkModal {...defaultProps} onClose={onClose} />);

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('에러가 없을 때 onClose를 자동으로 호출하지 않는다', () => {
    const onClose = vi.fn();
    render(<WorkModal {...defaultProps} onClose={onClose} />);

    expect(onClose).not.toHaveBeenCalled();
  });
});

// ────────────────────────────────────────────────────────────────
// 작품 정보 렌더링
// ────────────────────────────────────────────────────────────────
describe('WorkModal - 작품 정보 렌더링', () => {
  it('작품 제목을 렌더링한다', () => {
    render(<WorkModal {...defaultProps} />);

    expect(screen.getByText(/테스트 작품/)).toBeInTheDocument();
  });

  it('작품 제목과 연도를 "제목, 연도" 형식으로 렌더링한다', () => {
    render(<WorkModal {...defaultProps} />);

    expect(screen.getByText(/테스트 작품,\s*2024/)).toBeInTheDocument();
  });

  it('연도가 없을 때 제목만 렌더링한다', () => {
    mockUseWork.mockReturnValue({
      data: { ...mockWork, year: undefined },
      isLoading: false,
      isError: false,
    });

    render(<WorkModal {...defaultProps} />);

    const heading = screen.getByRole('heading');
    expect(heading.textContent).not.toContain(',');
    expect(heading.textContent).toContain('테스트 작품');
  });

  it('캡션이 있을 때 renderCaption을 호출한다', () => {
    const renderCaption = vi.fn(() => <div>캡션</div>);
    render(<WorkModal {...defaultProps} renderCaption={renderCaption} />);

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

    render(<WorkModal {...defaultProps} renderCaption={renderCaption} />);

    expect(renderCaption).not.toHaveBeenCalled();
  });
});

// ────────────────────────────────────────────────────────────────
// 닫기 버튼
// ────────────────────────────────────────────────────────────────
describe('WorkModal - 닫기 버튼', () => {
  it('닫기 버튼(×) 클릭 시 onClose를 호출한다', () => {
    const onClose = vi.fn();
    render(<WorkModal {...defaultProps} onClose={onClose} />);

    fireEvent.click(screen.getByText('×'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

// ────────────────────────────────────────────────────────────────
// 링크 클릭 이벤트 위임
//
// 리팩토링 후: 링크 클릭 처리는 useModalLinkHandler hook으로 분리됨.
// 컴포넌트가 hook을 올바른 인자로 호출하는지 검증합니다.
// 실제 링크 클릭 동작은 useModalLinkHandler.test.ts에서 검증합니다.
// ────────────────────────────────────────────────────────────────
// ────────────────────────────────────────────────────────────────
// 링크 클릭 이벤트 위임
//
// 리팩토링 후: 링크 클릭 처리는 useModalLinkHandler hook으로 분리됨.
// 컴포넌트가 hook을 올바른 인자로 호출하는지 검증합니다.
// 실제 링크 클릭 동작은 useModalLinkHandler.test.ts에서 검증합니다.
// ────────────────────────────────────────────────────────────────
describe('WorkModal - 링크 클릭 이벤트 위임', () => {
  it('useModalLinkHandler를 onWorkClick과 clearHover로 호출한다', () => {
    const onWorkClick = vi.fn();
    render(<WorkModal {...defaultProps} onWorkClick={onWorkClick} />);
    expect(mockUseModalLinkHandler).toHaveBeenCalledWith(onWorkClick, mockClearHover);
  });
});

// ────────────────────────────────────────────────────────────────
// workId 변경 시 hover 초기화
// ────────────────────────────────────────────────────────────────
describe('WorkModal - workId 변경', () => {
  it('workId가 변경될 때 clearHover를 호출한다', () => {
    const { rerender } = render(<WorkModal {...defaultProps} workId="work-1" />);

    // workId 변경
    rerender(<WorkModal {...defaultProps} workId="work-2" />);

    expect(mockClearHover).toHaveBeenCalled();
  });
});
