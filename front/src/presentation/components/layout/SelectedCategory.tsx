'use client';

import { motion } from 'framer-motion';
import type { KeywordCategory } from '@/types';

// SelectedCategory는 문장과 키워드만 필요하므로 간소화된 타입 사용
interface SentenceData {
  sentence: string;
  keywords: KeywordCategory[];
}

interface SelectedCategoryProps {
  sentence: SentenceData | null;
  keyword: KeywordCategory | null;
}

export default function SelectedCategory({ sentence, keyword }: SelectedCategoryProps) {
  if (!sentence || !keyword) {
    return (
      <div
        style={{
          height: 'var(--category-display-height)',
          padding: 'var(--category-display-padding)',
          paddingTop: 'var(--space-6)', // 상단 여백 추가
          paddingBottom: 'var(--space-4)', // 하단 여백 조정
        }}
      />
    );
  }

  // 문장을 키워드 단위로 분할
  const renderSentence = () => {
    const parts: Array<{ text: string; isKeyword: boolean }> = [];
    let lastIndex = 0;

    const sortedKeywords = [...sentence.keywords].sort((a, b) => a.startIndex - b.startIndex);

    sortedKeywords.forEach((kw) => {
      if (kw.startIndex > lastIndex) {
        parts.push({ text: sentence.sentence.slice(lastIndex, kw.startIndex), isKeyword: false });
      }
      parts.push({
        text: sentence.sentence.slice(kw.startIndex, kw.endIndex),
        isKeyword: kw.id === keyword.id,
      });
      lastIndex = kw.endIndex;
    });

    if (lastIndex < sentence.sentence.length) {
      parts.push({ text: sentence.sentence.slice(lastIndex), isKeyword: false });
    }

    return parts.map((part, index) => (
      <span
        key={index}
        style={{
          fontWeight: part.isKeyword ? 'var(--font-weight-bold)' : 'var(--font-weight-normal)',
          position: 'relative',
        }}
      >
        {part.text}
        {part.isKeyword && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.4 }}
            style={{
              position: 'absolute',
              top: 'var(--dot-offset-top)',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '8px',
              color: 'var(--dot-color)',
            }}
          >
            ˙
          </motion.span>
        )}
      </span>
    ));
  };

  return (
    <div
      style={{
        fontSize: 'var(--category-font-size)', // 홈 화면과 동일한 폰트 사이즈
        lineHeight: 'var(--category-line-height)',
        color: 'var(--color-text-primary)',
      }}
    >
      {renderSentence()}
    </div>
  );
}

