'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getSentenceCategories, getExhibitionCategories } from '@/lib/services/categoriesService';
import type { SentenceCategory, ExhibitionCategory } from '@/types';

interface CategoriesContextType {
  sentenceCategories: SentenceCategory[];
  exhibitionCategories: ExhibitionCategory[];
  isLoading: boolean;
}

const CategoriesContext = createContext<CategoriesContextType | undefined>(undefined);

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const [sentenceCategories, setSentenceCategories] = useState<SentenceCategory[]>([]);
  const [exhibitionCategories, setExhibitionCategories] = useState<ExhibitionCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load categories once on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const [sentences, exhibitions] = await Promise.all([
          getSentenceCategories(),
          getExhibitionCategories(),
        ]);
        setSentenceCategories(sentences);
        setExhibitionCategories(exhibitions);
      } catch (error) {
        console.error('[CategoriesContext] Failed to load categories:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCategories();
  }, []);

  return (
    <CategoriesContext.Provider
      value={{
        sentenceCategories,
        exhibitionCategories,
        isLoading,
      }}
    >
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories() {
  const context = useContext(CategoriesContext);
  if (context === undefined) {
    throw new Error('useCategories must be used within a CategoriesProvider');
  }
  return context;
}
