'use client';

import { motion } from 'framer-motion';
import type { KeywordCategory, SentenceCategory } from '@/types';

interface SelectedCategoryProps {
  sentence: SentenceCategory | null;
  keyword: KeywordCategory | null;
}

export default function SelectedCategory({ sentence, keyword }: SelectedCategoryProps) {
  if (!sentence || !keyword) {
    return (
      <div
        style={{
          height: 'var(--category-display-height)',
          padding: 'var(--category-display-padding)',
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: 0.2 }}
      className="border-b border-gray-200 bg-white"
      style={{
        padding: 'var(--category-display-padding)',
        minHeight: 'var(--category-display-height)',
        fontSize: 'var(--category-font-size)',
        lineHeight: 'var(--category-line-height)',
        color: 'var(--color-text-primary)',
      }}
    >
      {renderSentence()}
    </motion.div>
  );
}

