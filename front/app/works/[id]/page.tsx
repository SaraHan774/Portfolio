'use client';

import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Header from '@/app/components/layout/Header';
import Footer from '@/app/components/layout/Footer';
import SelectedCategory from '@/app/components/layout/SelectedCategory';
import {
  getWorkById,
  getWorksByKeywordId,
  getWorksByTextCategoryId,
  getSentenceByKeywordId,
  mockTextCategories,
} from '@/lib/mockData';
import FloatingWorkWindow from '@/app/components/work/FloatingWorkWindow';
import type { Work, KeywordCategory } from '@/types';

export default function WorkDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workId = params.id as string;

  const [work, setWork] = useState<Work | null>(null);
  const [relatedWorks, setRelatedWorks] = useState<Work[]>([]);
  const [selectedSentence, setSelectedSentence] = useState<{ sentence: any; keyword: KeywordCategory | null } | null>(null);
  const [selectedTextCategory, setSelectedTextCategory] = useState<string | null>(null);
  const [currentImageId, setCurrentImageId] = useState<string | null>(null); // 현재 보이는 이미지 ID
  const [isScrolled, setIsScrolled] = useState(false); // 스크롤 상태
  const [selectedWorkId, setSelectedWorkId] = useState<string | null>(workId); // 선택된 작품 ID
  const workTitleScrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);
  const [hoveredWorkId, setHoveredWorkId] = useState<string | null>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const hoverPositionRef = useRef({ x: 0, y: 0 }); // 최신 위치 값을 참조하기 위한 ref
  const observerRef = useRef<MutationObserver | null>(null); // MutationObserver 참조 저장
  const floatingWindowTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Floating Window 사라짐 타이머
  const hoverLinkTimeoutRef = useRef<NodeJS.Timeout | null>(null); // 링크 hover 지연 타이머
  
  // hoverPosition이 변경될 때마다 ref 업데이트
  useEffect(() => {
    hoverPositionRef.current = hoverPosition;
  }, [hoverPosition]);

  // 위키피디아 스타일: 스크롤 시 Floating Window 숨김
  useEffect(() => {
    if (!hoveredWorkId) return;

    const handleScroll = () => {
      setHoveredWorkId(null);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [hoveredWorkId]);

  // 위키피디아 스타일: 마우스가 Floating Window나 링크의 안전 마진 밖으로 너무 멀리 이동하면 사라짐
  useEffect(() => {
    if (!hoveredWorkId) return;

    const handleMouseMove = (e: MouseEvent) => {
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      const SAFE_MARGIN = 50; // 안전 마진: 50px
      
      // 현재 hover된 링크 찾기
      const links = document.querySelectorAll(`a[data-work-id="${hoveredWorkId}"]`);
      let isWithinSafeZone = false;
      
      // 링크들의 안전 마진 영역 확인
      links.forEach((link) => {
        const rect = link.getBoundingClientRect();
        // 링크 영역 + 50px 마진
        const safeLeft = rect.left - SAFE_MARGIN;
        const safeRight = rect.right + SAFE_MARGIN;
        const safeTop = rect.top - SAFE_MARGIN;
        const safeBottom = rect.bottom + SAFE_MARGIN;
        
        if (mouseX >= safeLeft && mouseX <= safeRight && 
            mouseY >= safeTop && mouseY <= safeBottom) {
          isWithinSafeZone = true;
        }
      });
      
      // Floating Window의 안전 마진 영역 확인
      // 실제 Floating Window 요소 찾기 (data-floating-window 속성 사용)
      const actualFloatingWindow = document.querySelector('[data-floating-window="true"]');
      if (actualFloatingWindow) {
        const rect = actualFloatingWindow.getBoundingClientRect();
        // Floating Window 영역 + 50px 마진
        const safeLeft = rect.left - SAFE_MARGIN;
        const safeRight = rect.right + SAFE_MARGIN;
        const safeTop = rect.top - SAFE_MARGIN;
        const safeBottom = rect.bottom + SAFE_MARGIN;
        
        if (mouseX >= safeLeft && mouseX <= safeRight && 
            mouseY >= safeTop && mouseY <= safeBottom) {
          isWithinSafeZone = true;
        }
      }
      
      // 안전 마진 밖으로 나갔을 때만 프리뷰 닫기
      if (!isWithinSafeZone) {
        // 기존 타이머 취소
        if (linkLeaveTimeoutRef.current) {
          clearTimeout(linkLeaveTimeoutRef.current);
          linkLeaveTimeoutRef.current = null;
        }
        setHoveredWorkId(null);
      }
    };

    // 마우스 이동을 실시간으로 추적
    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [hoveredWorkId]);

  useEffect(() => {
    const workData = getWorkById(workId);
    if (!workData) {
      router.push('/');
      return;
    }
    setWork(workData);
    setSelectedWorkId(workId); // URL의 작품 ID를 초기 선택 작품으로 설정

    // 관련 작품 가져오기 (첫 번째 문장형 카테고리 또는 텍스트 카테고리 기준)
    if (workData.sentenceCategoryIds.length > 0) {
      const keywordId = workData.sentenceCategoryIds[0];
      const allWorks = getWorksByKeywordId(keywordId); // 현재 작품 포함한 모든 작품
      setRelatedWorks(allWorks.filter((w) => w.id !== workId));
      const sentence = getSentenceByKeywordId(keywordId);
      const keyword = sentence?.keywords.find((kw) => kw.id === keywordId);
      if (sentence && keyword) {
        setSelectedSentence({ sentence, keyword });
      }
      setSelectedTextCategory(null);
    } else if (workData.textCategoryIds.length > 0) {
      const categoryId = workData.textCategoryIds[0];
      const allWorks = getWorksByTextCategoryId(categoryId); // 현재 작품 포함한 모든 작품
      setRelatedWorks(allWorks.filter((w) => w.id !== workId));
      setSelectedTextCategory(categoryId);
      setSelectedSentence(null);
    }

    // 첫 번째 이미지 ID 설정
    if (workData.images.length > 0) {
      const firstImage = workData.images.sort((a, b) => a.order - b.order)[0];
      setCurrentImageId(firstImage.id);
    }
  }, [workId, router]);

  // 스크롤 감지하여 Header와 같은 높이로 이동
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      // Header 높이(60px) 이상 스크롤되면 작품 제목을 Header와 같은 높이로
      setIsScrolled(scrollTop >= 60);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // 초기 상태 확인

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // 작품 제목 가로 스크롤 화살표 표시 체크
  const checkWorkTitleScrollButtons = () => {
    if (!workTitleScrollRef.current) return;
    const container = workTitleScrollRef.current;
    const { scrollLeft, scrollWidth, clientWidth } = container;
    
    // 스크롤이 필요한지 확인 (컨텐츠가 컨테이너보다 큰지)
    const needsScroll = scrollWidth > clientWidth;
    
    if (!needsScroll) {
      // 스크롤이 필요 없으면 모든 요소 숨김
      setShowLeftArrow(false);
      setShowRightArrow(false);
      setShowLeftFade(false);
      setShowRightFade(false);
      return;
    }
    
    // Apple/Google 스타일: 작은 threshold를 사용하여 더 자연스러운 감지
    const threshold = 5; // 5px threshold
    const isAtStart = scrollLeft < threshold;
    const isAtEnd = scrollLeft > scrollWidth - clientWidth - threshold;
    
    // 화살표: 스크롤 가능하고 해당 방향으로 스크롤할 수 있을 때만 표시
    setShowLeftArrow(!isAtStart);
    setShowRightArrow(!isAtEnd);
    
    // Fading edge: Apple/Google 스타일
    // - 왼쪽: 시작 위치가 아니면 표시 (왼쪽에 더 많은 콘텐츠가 있을 때)
    // - 오른쪽: 끝 위치가 아니면 표시 (오른쪽에 더 많은 콘텐츠가 있을 때)
    setShowLeftFade(!isAtStart);
    setShowRightFade(!isAtEnd);
  };

  useEffect(() => {
    if (relatedWorks.length > 0) {
      checkWorkTitleScrollButtons();
      const container = workTitleScrollRef.current;
      if (container) {
        container.addEventListener('scroll', checkWorkTitleScrollButtons);
        const resizeObserver = new ResizeObserver(checkWorkTitleScrollButtons);
        resizeObserver.observe(container);
        return () => {
          container.removeEventListener('scroll', checkWorkTitleScrollButtons);
          resizeObserver.disconnect();
        };
      }
    }
  }, [relatedWorks]);

  const scrollWorkTitlesLeft = () => {
    if (workTitleScrollRef.current) {
      workTitleScrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollWorkTitlesRight = () => {
    if (workTitleScrollRef.current) {
      workTitleScrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  // Intersection Observer로 현재 보이는 이미지 감지
  useEffect(() => {
    if (!selectedWorkId) return;

    // 선택된 작품 찾기
    const selectedWork = selectedWorkId === workId 
      ? work 
      : relatedWorks.find((w) => w.id === selectedWorkId);
    
    if (!selectedWork) return;

    // 선택된 작품의 첫 번째 이미지 ID 설정
    if (selectedWork.images && selectedWork.images.length > 0) {
      const firstImage = selectedWork.images.sort((a, b) => a.order - b.order)[0];
      setCurrentImageId(firstImage.id);
    }

    const imageElements = document.querySelectorAll('[data-image-id]');
    const observer = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => {
        // 가장 상단에 가까운 이미지를 찾음
        let topMostEntry: IntersectionObserverEntry | null = null;
        let topMostRatio = 0;

        for (const entry of entries) {
          if (entry.isIntersecting) {
            const rect = entry.boundingClientRect;
            
            // 상단 40% 영역 내에 있는 이미지 중 가장 가까운 것 선택
            if (rect.top < window.innerHeight * 0.4 && entry.intersectionRatio > topMostRatio) {
              topMostEntry = entry;
              topMostRatio = entry.intersectionRatio;
            }
          }
        }

        if (topMostEntry) {
          const target = topMostEntry.target as HTMLElement;
          const imageId = target.getAttribute('data-image-id');
          if (imageId) {
            setCurrentImageId(imageId);
          }
        }
      },
      {
        rootMargin: '-20% 0px -60% 0px', // 상단 20% 영역에 들어올 때 감지
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    imageElements.forEach((el) => observer.observe(el));

    return () => {
      imageElements.forEach((el) => observer.unobserve(el));
    };
  }, [selectedWorkId, work, relatedWorks, workId]);

  // hover 상태를 ref로 관리하여 최신 값을 항상 참조
  const hoveredWorkIdRef = useRef<string | null>(null);
  
  // hoveredWorkId가 변경될 때마다 ref 업데이트
  useEffect(() => {
    hoveredWorkIdRef.current = hoveredWorkId;
  }, [hoveredWorkId]);

  // 링크에서 벗어날 때의 타이머를 위한 ref
  const linkLeaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 캡션 내 링크에 호버 이벤트 추가 (useEffect로 DOM 조작)
  // 주의: 모든 hook은 조건부 렌더링 전에 호출되어야 함
  useEffect(() => {
    if (!work) return; // work가 없으면 early return
    
    const eventHandlers = new Map<HTMLElement, { enter: (e: Event) => void; leave: () => void; move: (e: Event) => void }>();
    
    const handleLinkMouseEnter = (e: Event) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[data-work-id]') as HTMLElement;
      if (link) {
        const workId = link.getAttribute('data-work-id');
        if (workId) {
          // 기존 타이머 취소
          if (hoverLinkTimeoutRef.current) {
            clearTimeout(hoverLinkTimeoutRef.current);
            hoverLinkTimeoutRef.current = null;
          }
          
          // 링크에서 벗어날 때의 타이머도 취소 (ref 사용)
          if (linkLeaveTimeoutRef.current) {
            clearTimeout(linkLeaveTimeoutRef.current);
            linkLeaveTimeoutRef.current = null;
          }
          
          // 위키피디아 스타일: 약간의 지연 후 프리뷰 표시 (500ms)
          hoverLinkTimeoutRef.current = setTimeout(() => {
            // 다른 링크의 프리뷰가 이미 표시되어 있다면 즉시 닫기
            if (hoveredWorkIdRef.current && hoveredWorkIdRef.current !== workId) {
              setHoveredWorkId(null);
            }
            
            // 링크 요소의 실제 위치를 가져와서 고정 위치로 배치
            const rect = link.getBoundingClientRect();
            
            // 링크의 아래쪽 중앙에 고정 배치 (위키피디아 스타일)
            // FloatingWorkWindow에서 이 위치를 기준으로 오프셋을 적용함
            const x = rect.left + rect.width / 2;
            const y = rect.bottom; // 링크 바로 아래
            
            setHoveredWorkId(workId);
            setHoverPosition({ x, y });
            hoverLinkTimeoutRef.current = null;
          }, 500); // 위키피디아 스타일: 500ms 지연 (더 자연스러운 UX)
        }
      }
    };

    const handleLinkMouseLeave = () => {
      // 기존 hover 타임아웃 취소 (아직 나타나지 않았다면)
      if (hoverLinkTimeoutRef.current) {
        clearTimeout(hoverLinkTimeoutRef.current);
        hoverLinkTimeoutRef.current = null;
      }
      
      // 기존 leave 타임아웃 취소 (ref 사용)
      if (linkLeaveTimeoutRef.current) {
        clearTimeout(linkLeaveTimeoutRef.current);
        linkLeaveTimeoutRef.current = null;
      }
      
      // 위키피디아 스타일: 링크에서 벗어나도 약간의 지연 후 사라짐
      // (Floating Window로 이동할 시간을 주기 위해)
      // 실제 사라지는 것은 mousemove 핸들러의 안전 마진 체크로 처리됨
      linkLeaveTimeoutRef.current = setTimeout(() => {
        // mousemove 핸들러가 안전 마진을 체크하므로 여기서는 추가 체크만 수행
        // (mousemove 핸들러가 이미 안전 마진 밖으로 나갔는지 체크함)
        linkLeaveTimeoutRef.current = null;
      }, 200); // 위키피디아 스타일: 200ms 지연 (실제 사라짐은 mousemove 핸들러가 처리)
    };

    const handleLinkMouseMove = (e: Event) => {
      // 마우스 이동에 따라 Floating Window 위치를 업데이트하지 않음
      // 위치는 처음 hover 시 한 번만 설정되고 고정됨 (위키피디아 스타일)
      // 이 핸들러는 이벤트 리스너 등록을 위한 것이므로 비워둠
    };
    
    const attachEventListeners = (container: Element) => {
      const links = container.querySelectorAll('a[data-work-id]');
      links.forEach((link) => {
        const linkElement = link as HTMLElement;
        
        // 이미 등록된 이벤트가 있으면 제거 (중복 방지)
        const existingHandlers = eventHandlers.get(linkElement);
        if (existingHandlers) {
          linkElement.removeEventListener('mouseenter', existingHandlers.enter);
          linkElement.removeEventListener('mouseleave', existingHandlers.leave);
          linkElement.removeEventListener('mousemove', existingHandlers.move);
        }
        
        // 새 이벤트 핸들러 저장 및 등록
        const handlers = {
          enter: handleLinkMouseEnter,
          leave: handleLinkMouseLeave,
          move: handleLinkMouseMove,
        };
        eventHandlers.set(linkElement, handlers);
        
        linkElement.addEventListener('mouseenter', handlers.enter);
        linkElement.addEventListener('mouseleave', handlers.leave);
        linkElement.addEventListener('mousemove', handlers.move);
      });
    };
    
    const setupEventListeners = () => {
      // 모든 기존 이벤트 리스너 제거 후 재등록
      eventHandlers.forEach((handlers, link) => {
        link.removeEventListener('mouseenter', handlers.enter);
        link.removeEventListener('mouseleave', handlers.leave);
        link.removeEventListener('mousemove', handlers.move);
      });
      eventHandlers.clear();
      
      // 모든 캡션 컨테이너에서 이벤트 리스너 재등록
      const captionContainers = document.querySelectorAll('[data-caption-container-id]');
      captionContainers.forEach(attachEventListeners);
      
      // MutationObserver로 새로운 캡션이 추가될 때 감지
      const observer = new MutationObserver(() => {
        // 새로운 링크가 추가되면 이벤트 리스너 등록
        const allContainers = document.querySelectorAll('[data-caption-container-id]');
        allContainers.forEach((container) => {
          const links = container.querySelectorAll('a[data-work-id]');
          links.forEach((link) => {
            const linkElement = link as HTMLElement;
            // 이미 등록된 링크가 아니면 등록
            if (!eventHandlers.has(linkElement)) {
              const handlers = {
                enter: handleLinkMouseEnter,
                leave: handleLinkMouseLeave,
                move: handleLinkMouseMove,
              };
              eventHandlers.set(linkElement, handlers);
              linkElement.addEventListener('mouseenter', handlers.enter);
              linkElement.addEventListener('mouseleave', handlers.leave);
              linkElement.addEventListener('mousemove', handlers.move);
            }
          });
        });
      });
      
      // main 요소를 관찰 (캡션들이 렌더링되는 곳)
      const mainElement = document.querySelector('main');
      if (mainElement) {
        observer.observe(mainElement, {
          childList: true,
          subtree: true,
        });
      }
      
      return observer;
    };
    
    // 약간의 지연 후 설정 (DOM이 준비될 시간)
    const timeoutId = setTimeout(() => {
      const observer = setupEventListeners();
      observerRef.current = observer; // ref에 저장
    }, 100);
    
    // work나 selectedWorkId가 변경될 때마다 재설정 (캡션이 다시 렌더링될 수 있음)
    const recheckTimeoutId = setTimeout(() => {
      // 재확인 및 재등록
      const captionContainers = document.querySelectorAll('[data-caption-container-id]');
      captionContainers.forEach(attachEventListeners);
    }, 300); // DOM이 완전히 렌더링된 후

    return () => {
      // 타임아웃 정리
      clearTimeout(timeoutId);
      clearTimeout(recheckTimeoutId);
      
      // MutationObserver 정리
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      
      // 모든 이벤트 리스너 제거
      eventHandlers.forEach((handlers, link) => {
        link.removeEventListener('mouseenter', handlers.enter);
        link.removeEventListener('mouseleave', handlers.leave);
        link.removeEventListener('mousemove', handlers.move);
      });
      eventHandlers.clear();
      
      // 모든 타이머 정리
      if (hoverLinkTimeoutRef.current) {
        clearTimeout(hoverLinkTimeoutRef.current);
        hoverLinkTimeoutRef.current = null;
      }
      if (linkLeaveTimeoutRef.current) {
        clearTimeout(linkLeaveTimeoutRef.current);
        linkLeaveTimeoutRef.current = null;
      }
      if (floatingWindowTimeoutRef.current) {
        clearTimeout(floatingWindowTimeoutRef.current);
        floatingWindowTimeoutRef.current = null;
      }
    };
  }, [work, selectedWorkId]); // work와 selectedWorkId를 의존성으로 추가

  if (!work) {
    return null;
  }

  // 이미지와 캡션 렌더링
  const renderCaption = (caption: string | undefined, captionId: string) => {
    if (!caption) return null;
    
    // HTML 파싱하여 링크 처리
    const parser = new DOMParser();
    const doc = parser.parseFromString(caption, 'text/html');
    const links = doc.querySelectorAll('a[data-work-id]');
    
    links.forEach((linkElement) => {
      const link = linkElement as HTMLElement;
      const workId = link.getAttribute('data-work-id');
      if (workId) {
        link.setAttribute('href', `/works/${workId}`);
        link.style.color = 'var(--color-text-primary)';
        link.style.textDecoration = 'underline';
        link.style.cursor = 'pointer';
        link.setAttribute('data-caption-id', captionId);
      }
    });

    return (
      <div
        key={captionId}
        data-caption-container-id={captionId}
        dangerouslySetInnerHTML={{ __html: doc.body.innerHTML }}
        style={{
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-text-muted)',
          lineHeight: 'var(--line-height-normal)',
          maxWidth: '200px',
          textAlign: 'left',
        }}
      />
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      {/* 상단 영역 */}
      <div className="flex-1 relative" style={{ paddingTop: '60px' }}>
        {/* 선택된 카테고리 영역 - 홈 화면처럼 좌측에 자연스럽게 배치 */}
        {selectedSentence && (
          <div
            className="hidden lg:block absolute"
            style={{
              left: 'var(--category-margin-left)', // 48px
              top: 'var(--space-16)', // 헤더 아래 여백 (홈 화면과 동일)
              maxWidth: 'calc(50% - var(--content-gap) - var(--category-margin-left))',
            }}
          >
      <SelectedCategory
              sentence={selectedSentence.sentence}
              keyword={selectedSentence.keyword}
      />
          </div>
        )}
        {/* 중앙 컨텐츠 영역 */}
      <main
        style={{
            minHeight: 'calc(100vh - 120px)',
            paddingTop: 'var(--space-6)',
        }}
      >
        {/* 작품 제목 - 가로 스크롤 리스트 (스크롤 시 Header와 같은 줄에 sticky) */}
        {relatedWorks.length > 0 && (
          <div
            style={{
              position: 'sticky',
              top: isScrolled ? '0' : '60px', // 스크롤 시 Header와 같은 높이, 초기에는 Header 아래
              left: '50%',
              transform: 'translateX(-50%)',
              width: '60%',
              maxWidth: '600px',
              backgroundColor: 'transparent',
              zIndex: 60, // Header(z-50)보다 높게 설정하여 위에 표시
              marginBottom: 'var(--space-4)',
              transition: 'top 0.3s ease, background-color 0.3s ease',
            }}
          >
            {/* 스크롤 컨테이너 */}
            <div
              ref={workTitleScrollRef}
              className={`horizontal-scroll-container ${showLeftFade ? 'show-left-fade' : ''} ${showRightFade ? 'show-right-fade' : ''}`}
              style={{
                width: '100%',
                maxHeight: '60px',
                overflowX: 'auto',
                overflowY: 'hidden',
                padding: 'var(--space-3)',
                scrollbarWidth: 'none',
                scrollbarColor: 'transparent transparent',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: 'var(--space-2)',
                  alignItems: 'center',
                  height: '100%',
                }}
              >
                {/* 모든 작품 제목 (현재 작품 포함) */}
                <button
                  onClick={() => setSelectedWorkId(workId)}
                  style={{
                    flexShrink: 0,
                    width: '70px',
                    fontWeight: selectedWorkId === workId ? 'var(--font-weight-bold)' : 'var(--font-weight-normal)',
                    fontSize: '10px',
                    color: 'var(--color-text-primary)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'center',
                    padding: 0,
                  }}
                  className="hover:underline"
                >
                  {work.title}
                </button>
                {relatedWorks.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => setSelectedWorkId(w.id)}
                    style={{
                      flexShrink: 0,
                      width: '70px',
                      fontWeight: selectedWorkId === w.id ? 'var(--font-weight-bold)' : 'var(--font-weight-normal)',
                      fontSize: '10px',
                      color: 'var(--color-text-primary)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'center',
                      padding: 0,
                    }}
                    className="hover:underline"
                  >
                    {w.title}
                  </button>
                ))}
              </div>
            </div>

            {/* 좌측 화살표 (컨테이너 외부 좌측 끝에 배치) */}
            {showLeftArrow && (
              <button
                onClick={scrollWorkTitlesLeft}
                style={{
                  position: 'absolute',
                  left: '-40px', // 컨테이너 외부로 이동
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 11,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 'var(--space-2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  color: 'var(--color-text-primary)',
                  opacity: 0.7,
                  transition: 'opacity 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
              >
                ‹
              </button>
            )}

            {/* 우측 화살표 (컨테이너 외부 우측 끝에 배치) */}
            {showRightArrow && (
              <button
                onClick={scrollWorkTitlesRight}
                style={{
                  position: 'absolute',
                  right: '-40px', // 컨테이너 외부로 이동
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 11,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 'var(--space-2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  color: 'var(--color-text-primary)',
                  opacity: 0.7,
                  transition: 'opacity 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
              >
                ›
              </button>
            )}
          </div>
        )}

        {/* 선택된 작품의 이미지들 표시 */}
        {selectedWorkId && (() => {
          // 선택된 작품 찾기 (현재 작품 또는 관련 작품 중)
          const selectedWork = selectedWorkId === workId 
            ? work 
            : relatedWorks.find((w) => w.id === selectedWorkId);
          
          if (!selectedWork || !selectedWork.images || selectedWork.images.length === 0) {
            return null;
          }

          return (
            <div
              style={{
                maxWidth: '1200px',
                margin: '0 auto',
                paddingLeft: 'var(--space-6)',
                paddingRight: 'var(--space-6)',
                paddingTop: 'var(--space-4)',
                paddingBottom: 'var(--space-10)',
              }}
            >
              {selectedWork.images
            .sort((a, b) => a.order - b.order)
                .map((image) => {
                  const isCurrent = currentImageId === image.id;

                  return (
              <div
                key={image.id}
                      data-image-id={image.id}
                className="work-image-container"
                style={{
                  marginBottom: 'var(--space-10)',
                        position: 'relative',
                        width: '100%',
                        scrollMarginTop: '200px', // 스크롤 시 여유 공간
                      }}
                    >
                      <div
                        style={{
                  display: 'flex',
                          alignItems: 'flex-end',
                          gap: 'var(--space-4)',
                }}
              >
                <div
                  style={{
                    flex: 1,
                    position: 'relative',
                  }}
                >
                  <Image
                    src={image.url}
                            alt={selectedWork.title}
                    width={image.width}
                    height={image.height}
                    style={{
                      width: '100%',
                      height: 'auto',
                      borderRadius: '4px',
                    }}
                  />
                </div>
                        {/* 캡션을 이미지 우측 하단 옆에 배치 */}
                {image.caption && (
                  <div
                    className="work-caption"
                    style={{
                      flexShrink: 0,
                      width: '200px',
                              marginBottom: 'var(--space-2)', // 이미지 하단과 약간의 간격
                    }}
                  >
                    {renderCaption(image.caption, image.id)}
                  </div>
                )}
              </div>
                    </div>
                  );
                })}
        </div>
          );
        })()}
      </main>
      </div>
      
      {/* Floating Work Window - 위키피디아 스타일 */}
      {hoveredWorkId && (
        <div 
          className="floating-work-window-container"
          onMouseEnter={(e) => {
            // Floating Window 위에 마우스가 있을 때는 유지 (위키피디아 스타일)
            e.stopPropagation();
          }}
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            width: '100vw',
            height: '100vh',
            pointerEvents: 'none',
            zIndex: 999,
          }}
        >
          <div
            style={{
              pointerEvents: 'auto',
            }}
          >
            <FloatingWorkWindow 
              workId={hoveredWorkId} 
              position={hoverPosition}
            />
          </div>
        </div>
      )}
      
      <Footer />
    </div>
  );
}
