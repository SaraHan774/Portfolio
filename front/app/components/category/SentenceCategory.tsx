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
        
        return (
          <span
            key={index}
            onClick={() => onKeywordSelect(part.keyword!.id)}
            onMouseEnter={() => onKeywordHover(part.keyword!.id)}
            onMouseLeave={() => onKeywordHover(null)}
            style={{
              fontWeight: isSelected || isHovered ? 'var(--font-weight-bold)' : 'var(--font-weight-normal)',
              cursor: 'pointer',
              color: isSelected || isHovered ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              transition: 'all 0.1s ease',
            }}
          >
            {part.text}
          </span>
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
        padding: 'var(--space-6) var(--space-3)',
      }}
    >
      {renderSentence()}
    </div>
  );
}

