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

  if (!work) {
    return null;
  }

  // 이미지와 캡션 렌더링
  const renderCaption = (caption: string | undefined) => {
    if (!caption) return null;
    
    // HTML 파싱하여 링크 처리
    const parser = new DOMParser();
    const doc = parser.parseFromString(caption, 'text/html');
    const links = doc.querySelectorAll('a[data-work-id]');
    
    links.forEach((linkElement) => {
      const link = linkElement as HTMLElement;
      const workId = link.getAttribute('data-work-id');
      const workTitle = link.getAttribute('data-work-title');
      if (workId) {
        link.setAttribute('href', `/works/${workId}`);
        link.style.color = 'var(--color-text-primary)';
        link.style.textDecoration = 'underline';
      }
    });

    return (
      <div
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
                    {renderCaption(image.caption)}
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
      <Footer />
    </div>
  );
}
