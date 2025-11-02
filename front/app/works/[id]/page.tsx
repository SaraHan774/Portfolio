'use client';

import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
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

  useEffect(() => {
    const workData = getWorkById(workId);
    if (!workData) {
      router.push('/');
      return;
    }
    setWork(workData);

    // 관련 작품 가져오기 (첫 번째 문장형 카테고리 또는 텍스트 카테고리 기준)
    if (workData.sentenceCategoryIds.length > 0) {
      const keywordId = workData.sentenceCategoryIds[0];
      const related = getWorksByKeywordId(keywordId).filter((w) => w.id !== workId);
      setRelatedWorks(related);
      const sentence = getSentenceByKeywordId(keywordId);
      const keyword = sentence?.keywords.find((kw) => kw.id === keywordId);
      if (sentence && keyword) {
        setSelectedSentence({ sentence, keyword });
      }
      setSelectedTextCategory(null);
    } else if (workData.textCategoryIds.length > 0) {
      const categoryId = workData.textCategoryIds[0];
      const related = getWorksByTextCategoryId(categoryId).filter((w) => w.id !== workId);
      setRelatedWorks(related);
      setSelectedTextCategory(categoryId);
      setSelectedSentence(null);
    }
  }, [workId, router]);

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
      {/* 선택된 카테고리 영역 (문장형 카테고리인 경우에만 표시) */}
      <SelectedCategory
        sentence={selectedSentence?.sentence || null}
        keyword={selectedSentence?.keyword || null}
      />
      <main
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: 'var(--space-6)',
          width: '100%',
        }}
      >
        {/* 작품 제목 Grid */}
        {relatedWorks.length > 0 && (
          <div style={{ marginBottom: 'var(--space-8)' }}>
            <div
              className="grid gap-4"
              style={{
                gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                fontSize: 'var(--font-size-sm)',
                gap: '16px',
              }}
            >
              {relatedWorks.map((w) => (
                <Link
                  key={w.id}
                  href={`/works/${w.id}`}
                  style={{
                    fontWeight: w.id === workId ? 'var(--font-weight-bold)' : 'var(--font-weight-normal)',
                    fontSize: w.id === workId ? 'var(--font-size-base)' : 'var(--font-size-sm)',
                    color: 'var(--color-text-primary)',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                  }}
                  className="hover:underline"
                >
                  {w.title}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 작품 이미지들 */}
        <div style={{ marginTop: 'var(--space-8)' }}>
          {work.images
            .sort((a, b) => a.order - b.order)
            .map((image) => (
              <div
                key={image.id}
                className="work-image-container"
                style={{
                  marginBottom: 'var(--space-10)',
                  display: 'flex',
                  gap: 'var(--space-8)',
                  alignItems: 'flex-start',
                }}
              >
                <div
                  style={{
                    flex: 1,
                    position: 'relative',
                    maxWidth: '1200px',
                  }}
                >
                  <Image
                    src={image.url}
                    alt={work.title}
                    width={image.width}
                    height={image.height}
                    style={{
                      width: '100%',
                      height: 'auto',
                      borderRadius: '4px',
                    }}
                  />
                </div>
                {image.caption && (
                  <div
                    className="work-caption"
                    style={{
                      flexShrink: 0,
                      width: '200px',
                    }}
                  >
                    {renderCaption(image.caption)}
                  </div>
                )}
              </div>
            ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
