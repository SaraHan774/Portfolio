'use client';

import { motion } from 'framer-motion';
import type { SentenceCategory as SentenceCategoryType, KeywordCategory } from '@/types';

interface SentenceCategoryProps {
  category: SentenceCategoryType;
  selectedKeywordId: string | null;
  onKeywordSelect: (keywordId: string) => void;
  hoveredKeywordId: string | null;
  onKeywordHover: (keywordId: string | null) => void;
}

export default function SentenceCategory({
  category,
  selectedKeywordId,
  onKeywordSelect,
  hoveredKeywordId,
  onKeywordHover,
}: SentenceCategoryProps) {
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
        
        // 텍스트를 글자 단위로 분할하여 좌->우 애니메이션 적용
        const characters = part.text.split('');
        
        return (
          <motion.span
            key={index}
            onClick={() => onKeywordSelect(part.keyword!.id)}
            onMouseEnter={() => onKeywordHover(part.keyword!.id)}
            onMouseLeave={() => onKeywordHover(null)}
            style={{
              cursor: 'pointer',
              color: isSelected || isHovered ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              transition: 'color 0.2s ease-in-out',
              position: 'relative',
              display: 'inline-block',
            }}
            initial={false}
            animate={isSelected || isHovered ? 'bold' : 'normal'}
          >
            <motion.span
              style={{ display: 'inline-block' }}
              variants={{
                bold: {
                  transition: {
                    staggerChildren: 0.05, // 각 글자 간 50ms 간격 (전체 약 500ms)
                  },
                },
                normal: {
                  transition: {
                    staggerChildren: 0.02,
                  },
                },
              }}
            >
              {characters.map((char, charIndex) => (
                <motion.span
                  key={charIndex}
                  style={{ display: 'inline-block' }}
                  variants={{
                    bold: {
                      fontWeight: 'var(--font-weight-bold)',
                      transition: {
                        duration: 0.15, // 각 글자당 150ms
                        ease: 'easeInOut',
                      },
                    },
                    normal: {
                      fontWeight: 'var(--font-weight-normal)',
                      transition: {
                        duration: 0.15,
                        ease: 'easeInOut',
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
      {renderSentence()}
    </div>
  );
}

