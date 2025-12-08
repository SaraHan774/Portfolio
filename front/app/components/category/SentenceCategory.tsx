'use client';

import { motion } from 'framer-motion';
import type { SentenceCategory as SentenceCategoryType, KeywordCategory, CategoryState } from '@/types';

interface SentenceCategoryProps {
  category: SentenceCategoryType;
  selectedKeywordId: string | null;
  onKeywordSelect: (keywordId: string) => void;
  hoveredKeywordId: string | null;
  onKeywordHover: (keywordId: string | null) => void;
  selectedWorkIds?: string[]; // 현재 선택된 카테고리의 작업 ID 목록 (disabled 상태 계산용)
}

export default function SentenceCategory({
  category,
  selectedKeywordId,
  onKeywordSelect,
  hoveredKeywordId,
  onKeywordHover,
  selectedWorkIds = [],
}: SentenceCategoryProps) {
  // 키워드의 상태를 계산하는 함수
  const getKeywordState = (keyword: KeywordCategory, isSelected: boolean, isHovered: boolean): CategoryState => {
    // active 상태: 선택된 경우
    if (isSelected) {
      return 'active';
    }

    // hover 상태: 마우스 오버 시
    if (isHovered) {
      return 'hover';
    }

    // disabled 상태: 선택된 카테고리가 있고, 이 키워드가 선택된 작업에 포함되지 않는 경우
    // 주의: workOrders가 비어있어도 Work.sentenceCategoryIds로 연결된 작업이 있을 수 있음
    if (selectedWorkIds.length > 0 && keyword.workOrders && keyword.workOrders.length > 0) {
      const keywordWorkIds = keyword.workOrders.map(order => order.workId);
      const hasCommonWork = keywordWorkIds.some(workId => selectedWorkIds.includes(workId));
      if (!hasCommonWork) {
        return 'disabled';
      }
    }

    // 모든 키워드는 기본적으로 클릭 가능
    // (workOrders가 비어있어도 Work.sentenceCategoryIds를 통해 작업 조회 가능)
    return 'clickable';
  };

  // 상태에 따른 스타일을 반환하는 함수
  const getKeywordStyle = (state: CategoryState, _isHovered: boolean) => {
    const baseStyle: React.CSSProperties = {
      position: 'relative',
      display: 'inline-block',
      transition: 'color 0.2s ease-in-out',
    };

    switch (state) {
      case 'basic':
        return {
          ...baseStyle,
          color: 'var(--color-category-basic)',
          cursor: 'default',
        };
      case 'clickable':
        return {
          ...baseStyle,
          color: 'var(--color-category-clickable)', // 완전 검정 - 클릭 가능
          cursor: 'pointer',
        };
      case 'hover':
        return {
          ...baseStyle,
          color: 'transparent',
          WebkitTextStroke: '0.7px var(--color-category-hover-stroke)',
          cursor: 'pointer',
        };
      case 'active':
        return {
          ...baseStyle,
          color: 'transparent',
          WebkitTextStroke: '0.7px var(--color-category-hover-stroke)',
          cursor: 'pointer',
        };
      case 'disabled':
        return {
          ...baseStyle,
          color: 'var(--color-category-disabled)',
          cursor: 'default',
        };
      default:
        return baseStyle;
    }
  };

  // 문장을 키워드 단위로 분할하여 렌더링
  const renderSentence = () => {
    const { sentence, keywords } = category;
    const parts: Array<{ text: string; keyword?: KeywordCategory }> = [];
    let lastIndex = 0;

    // 키워드를 startIndex 기준으로 정렬
    const sortedKeywords = [...keywords].sort((a, b) => a.startIndex - b.startIndex);

    sortedKeywords.forEach((keyword) => {
      // 키워드 앞의 일반 텍스트
      if (keyword.startIndex > lastIndex) {
        parts.push({ text: sentence.slice(lastIndex, keyword.startIndex) });
      }
      // 키워드
      parts.push({ text: sentence.slice(keyword.startIndex, keyword.endIndex), keyword });
      lastIndex = keyword.endIndex;
    });

    // 마지막 일반 텍스트
    if (lastIndex < sentence.length) {
      parts.push({ text: sentence.slice(lastIndex) });
    }

    return parts.map((part, index) => {
      if (part.keyword) {
        const isSelected = selectedKeywordId === part.keyword.id;
        const isHovered = hoveredKeywordId === part.keyword.id;
        const state = getKeywordState(part.keyword, isSelected, isHovered);
        const keywordStyle = getKeywordStyle(state, isHovered);
        
        // 텍스트를 글자 단위로 분할하여 좌->우 애니메이션 적용
        const characters = part.text.split('');

        // 클릭 가능 여부 확인
        const isClickable = state === 'clickable' || state === 'active' || state === 'hover';

        // hover: 샤라락 효과로 bold 전환
        // selected: 즉시 bold 유지
        // normal: 일반 weight
        const animateState = isHovered ? 'hover' : (isSelected ? 'selected' : 'normal');

        return (
          <motion.span
            key={index}
            onClick={() => {
              if (isClickable) {
                onKeywordSelect(part.keyword!.id);
              }
            }}
            onMouseEnter={() => {
              if (state !== 'basic' && state !== 'disabled') {
                onKeywordHover(part.keyword!.id);
              }
            }}
            onMouseLeave={() => onKeywordHover(null)}
            style={keywordStyle}
            initial={false}
            animate={animateState}
          >
            <motion.span
              style={{ display: 'inline-block' }}
              variants={{
                hover: {
                  transition: {
                    staggerChildren: 0.03, // 각 글자 간 30ms 간격 (좌→우 샤라락)
                  },
                },
                selected: {
                  transition: {
                    staggerChildren: 0, // 즉시 적용 (샤라락 없이 bold 유지)
                  },
                },
                normal: {
                  transition: {
                    staggerChildren: 0,
                  },
                },
              }}
            >
              {characters.map((char, charIndex) => (
                <motion.span
                  key={charIndex}
                  style={{ display: 'inline-block' }}
                  variants={{
                    hover: {
                      fontWeight: 700,
                      transition: {
                        duration: 0.1,
                        ease: 'easeOut',
                      },
                    },
                    selected: {
                      fontWeight: 700,
                      transition: {
                        duration: 0,
                      },
                    },
                    normal: {
                      fontWeight: 400,
                      transition: {
                        duration: 0.1,
                        ease: 'easeOut',
                      },
                    },
                  }}
                >
                  {char}
                </motion.span>
              ))}
            </motion.span>
            {/* 선택 시 점(˙) 표시 - 원래 위치에서 */}
            {isSelected && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, ease: 'easeOut', delay: 0.4 }}
                style={{
                  position: 'absolute',
                  top: 'var(--dot-offset-top)', // -8px (글자 정중앙 위)
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '14px', // 10px에서 4px 증가
                  color: 'var(--dot-color)',
                  lineHeight: 1,
                }}
              >
                ˙
              </motion.span>
            )}
          </motion.span>
        );
      }
      return <span key={index}>{part.text}</span>;
    });
  };

  return (
    <div
      style={{
        fontSize: 'var(--font-size-lg)',
        lineHeight: 'var(--line-height-relaxed)',
        color: 'var(--color-text-secondary)',
      }}
    >
      {'\''}
      {renderSentence()}
      {'\''}
    </div>
  );
}

