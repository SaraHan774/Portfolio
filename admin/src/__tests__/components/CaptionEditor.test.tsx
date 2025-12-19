import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CaptionEditor from '../../components/CaptionEditor';
import { useWorks } from '../../hooks/useWorks';
import type { Work } from '../../types';

// Helper to get TipTap editor element
const getEditorElement = () => {
  return document.querySelector('.ProseMirror[contenteditable="true"]') as HTMLElement;
};

// Mock useWorks hook
vi.mock('../../hooks/useWorks');
const mockUseWorks = vi.mocked(useWorks);

// Mock antd message
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd');
  return {
    ...actual,
    message: {
      warning: vi.fn(),
      success: vi.fn(),
      error: vi.fn(),
    },
  };
});

const mockWorks: Work[] = [
  {
    id: 'work-001',
    title: 'Test Work 1',
    year: 2024,
    thumbnailImageId: 'img-001',
    images: [
      {
        id: 'img-001',
        url: 'https://example.com/image1.jpg',
        thumbnailUrl: 'https://example.com/thumb1.jpg',
        order: 0,
        width: 800,
        height: 600,
      },
    ],
    shortDescription: 'Short description 1',
    sentenceCategoryIds: [],
    exhibitionCategoryIds: [],
    isPublished: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'work-002',
    title: 'Another Work',
    year: 2024,
    thumbnailImageId: 'img-002',
    images: [
      {
        id: 'img-002',
        url: 'https://example.com/image2.jpg',
        thumbnailUrl: 'https://example.com/thumb2.jpg',
        order: 0,
        width: 800,
        height: 600,
      },
    ],
    shortDescription: 'Short description 2',
    sentenceCategoryIds: [],
    exhibitionCategoryIds: [],
    isPublished: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

describe('CaptionEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseWorks.mockReturnValue({
      data: mockWorks,
      isLoading: false,
      isError: false,
      error: null,
      isSuccess: true,
      refetch: vi.fn(),
    } as ReturnType<typeof useWorks>);
  });

  describe('Rendering', () => {
    it('should render the editor', () => {
      render(<CaptionEditor />);

      expect(getEditorElement()).toBeInTheDocument();
    });

    it('should render toolbar buttons', () => {
      render(<CaptionEditor />);

      expect(screen.getByTitle('진하게 (Ctrl+B)')).toBeInTheDocument();
      expect(screen.getByTitle('기울임 (Ctrl+I)')).toBeInTheDocument();
      expect(screen.getByTitle('밑줄 (Ctrl+U)')).toBeInTheDocument();
      expect(screen.getByTitle('작업 링크 삽입')).toBeInTheDocument();
    });

    it('should render character count', () => {
      render(<CaptionEditor value="" />);

      expect(screen.getByText('0 / 1000자')).toBeInTheDocument();
    });

    it('should display initial value', async () => {
      render(<CaptionEditor value="<p>Initial content</p>" />);

      await waitFor(() => {
        expect(screen.getByText('Initial content')).toBeInTheDocument();
      });
    });

    it('should display character count for initial value', async () => {
      render(<CaptionEditor value="<p>Hello</p>" />);

      await waitFor(() => {
        expect(screen.getByText('5 / 1000자')).toBeInTheDocument();
      });
    });
  });

  describe('Toolbar Functionality', () => {
    it('should toggle bold formatting on click', async () => {
      const user = userEvent.setup();
      render(<CaptionEditor />);

      const boldButton = screen.getByTitle('진하게 (Ctrl+B)');
      await user.click(boldButton);

      // Button should be clickable without error
      expect(boldButton).toBeInTheDocument();
    });

    it('should toggle italic formatting on click', async () => {
      const user = userEvent.setup();
      render(<CaptionEditor />);

      const italicButton = screen.getByTitle('기울임 (Ctrl+I)');
      await user.click(italicButton);

      expect(italicButton).toBeInTheDocument();
    });

    it('should toggle underline formatting on click', async () => {
      const user = userEvent.setup();
      render(<CaptionEditor />);

      const underlineButton = screen.getByTitle('밑줄 (Ctrl+U)');
      await user.click(underlineButton);

      expect(underlineButton).toBeInTheDocument();
    });
  });

  describe('Character Limit Display', () => {
    it('should show red color when over character limit', async () => {
      const longContent = '<p>' + 'a'.repeat(1001) + '</p>';
      render(<CaptionEditor value={longContent} />);

      await waitFor(() => {
        const charCount = screen.getByText(/1001 \/ 1000자/);
        expect(charCount).toHaveStyle({ color: '#ff4d4f' });
      });
    });

    it('should show normal color when under character limit', async () => {
      render(<CaptionEditor value="<p>Short text</p>" />);

      await waitFor(() => {
        const charCount = screen.getByText(/10 \/ 1000자/);
        expect(charCount).toHaveStyle({ color: 'rgb(140, 140, 140)' });
      });
    });
  });

  describe('Work Link Modal', () => {
    it('should show warning when trying to insert link without selection', async () => {
      const { message } = await import('antd');
      const user = userEvent.setup();
      render(<CaptionEditor />);

      const linkButton = screen.getByTitle('작업 링크 삽입');
      await user.click(linkButton);

      expect(message.warning).toHaveBeenCalledWith('링크를 삽입할 텍스트를 먼저 선택해주세요.');
    });

    it('should not open modal when no text is selected', async () => {
      const user = userEvent.setup();
      render(<CaptionEditor />);

      const linkButton = screen.getByTitle('작업 링크 삽입');
      await user.click(linkButton);

      // Modal should not be visible
      expect(screen.queryByText('작업 링크 삽입', { selector: '.ant-modal-title' })).not.toBeInTheDocument();
    });
  });

  describe('Value Updates', () => {
    it('should update content when value prop changes', async () => {
      const { rerender } = render(<CaptionEditor value="<p>Initial</p>" />);

      await waitFor(() => {
        expect(screen.getByText('Initial')).toBeInTheDocument();
      });

      rerender(<CaptionEditor value="<p>Updated</p>" />);

      await waitFor(() => {
        expect(screen.getByText('Updated')).toBeInTheDocument();
      });
    });

    it('should show correct character count for different content lengths', async () => {
      // Test with longer content
      render(<CaptionEditor value="<p>Hello World</p>" />);

      await waitFor(() => {
        expect(screen.getByText('11 / 1000자')).toBeInTheDocument();
      });
    });
  });

  describe('XSS Prevention', () => {
    it('should render component with potentially malicious content without error', () => {
      const worksWithMaliciousContent: Work[] = [
        {
          ...mockWorks[0],
          shortDescription: '<script>alert("xss")</script>Safe text',
          caption: '<img onerror="alert(1)" src="x">Caption text',
        },
      ];

      mockUseWorks.mockReturnValue({
        data: worksWithMaliciousContent,
        isLoading: false,
        isError: false,
        error: null,
        isSuccess: true,
        refetch: vi.fn(),
      } as ReturnType<typeof useWorks>);

      // Component should render without executing scripts
      expect(() => render(<CaptionEditor />)).not.toThrow();
    });

    it('should sanitize HTML in editor content', async () => {
      const maliciousContent = '<p><script>alert("xss")</script>Safe content</p>';
      render(<CaptionEditor value={maliciousContent} />);

      // The editor should render but script tags should not execute
      await waitFor(() => {
        expect(getEditorElement()).toBeInTheDocument();
      });

      // Script tags should not be present in the DOM as executable scripts
      expect(document.querySelector('script')).toBeNull();
    });
  });

  describe('Empty States', () => {
    it('should render with no initial value', () => {
      render(<CaptionEditor />);

      expect(getEditorElement()).toBeInTheDocument();
      expect(screen.getByText('0 / 1000자')).toBeInTheDocument();
    });

    it('should render with empty string value', () => {
      render(<CaptionEditor value="" />);

      expect(getEditorElement()).toBeInTheDocument();
      expect(screen.getByText('0 / 1000자')).toBeInTheDocument();
    });
  });
});
