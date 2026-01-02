'use client';

/**
 * Layout Stability Context
 *
 * PortfolioLayout의 contentPaddingTop 안정화 상태를 하위 컴포넌트에 전달
 * Caption과 같이 layout에 의존하는 컴포넌트가 안정화된 후에 위치를 계산할 수 있도록 함
 */

import { createContext, useContext, ReactNode } from 'react';

interface LayoutStabilityContextValue {
  /** Layout이 안정화되었는지 여부 (contentPaddingTop 측정 완료) */
  isLayoutStable: boolean;
  /** 현재 contentPaddingTop 값 (px 단위 문자열) */
  contentPaddingTop: string;
}

const LayoutStabilityContext = createContext<LayoutStabilityContextValue | null>(null);

interface LayoutStabilityProviderProps {
  children: ReactNode;
  isLayoutStable: boolean;
  contentPaddingTop: string;
}

export function LayoutStabilityProvider({
  children,
  isLayoutStable,
  contentPaddingTop,
}: LayoutStabilityProviderProps) {
  return (
    <LayoutStabilityContext.Provider value={{ isLayoutStable, contentPaddingTop }}>
      {children}
    </LayoutStabilityContext.Provider>
  );
}

export function useLayoutStability() {
  const context = useContext(LayoutStabilityContext);
  if (!context) {
    throw new Error('useLayoutStability must be used within LayoutStabilityProvider');
  }
  return context;
}
