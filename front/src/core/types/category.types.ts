// Category-related types

export interface WorkOrder {
  workId: string;
  order: number;
}

export interface KeywordCategory {
  id: string;
  name: string;
  startIndex: number;
  endIndex: number;
  workOrders: WorkOrder[];
}

export interface SentenceCategory {
  id: string;
  sentence: string;
  keywords: KeywordCategory[];
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 전시명 카테고리: 통으로 클릭 (작업명 + 간단 설명)
export interface ExhibitionCategory {
  id: string;
  title: string;              // 작업명 (예: "Cushioning Attack")
  description: {              // 간단 설명 (구조화된 형태)
    exhibitionType: string;   // 전시 유형 (예: "2인전", "개인전", "그룹전")
    venue: string;            // 공간 (예: "YPCSpace")
    year: number;             // 년도 (예: 2023)
  };
  displayOrder: number;
  workOrders: WorkOrder[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 하위 호환성을 위한 별칭 (deprecated)
/** @deprecated Use ExhibitionCategory instead */
export type TextCategory = ExhibitionCategory;

// 카테고리 상태 타입 정의
export type CategoryState = 'basic' | 'clickable' | 'hover' | 'active' | 'disabled';
