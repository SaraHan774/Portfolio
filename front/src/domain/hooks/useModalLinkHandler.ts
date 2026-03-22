import { useEffect } from 'react';

/**
 * 모달 캡션 내 작품 링크 클릭 처리 hook
 *
 * document.body에 이벤트 위임을 설정하여
 * [data-is-modal="true"] 내부의 a[data-work-id] 클릭을 처리합니다.
 */
export function useModalLinkHandler(
  onWorkClick: (workId: string) => void,
  clearHover: () => void
): void {
  useEffect(() => {
    const handleLinkClick = (e: Event) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[data-work-id]') as HTMLElement;

      const modalCaptionContainer = link?.closest('[data-is-modal="true"]');
      if (link && modalCaptionContainer) {
        e.preventDefault();
        const clickedWorkId = link.getAttribute('data-work-id');
        if (clickedWorkId) {
          clearHover();
          onWorkClick(clickedWorkId);
        }
      }
    };

    document.body.addEventListener('click', handleLinkClick);
    return () => {
      document.body.removeEventListener('click', handleLinkClick);
    };
  }, [onWorkClick, clearHover]);
}
