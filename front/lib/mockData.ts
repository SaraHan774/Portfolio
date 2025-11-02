// 하드코딩된 가짜 데이터 (admin의 mockData 참고하여 확장)
import type { Work, SentenceCategory, TextCategory, WorkImage, KeywordCategory } from '@/types';

// 더미 작업 이미지 데이터 생성 함수
const createMockImages = (workId: string, count: number): WorkImage[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `img-${workId}-${i + 1}`,
    url: `https://picsum.photos/1920/1080?random=${workId}-${i + 1}`,
    thumbnailUrl: `https://picsum.photos/300/300?random=${workId}-${i + 1}`,
    listThumbnailUrl: `https://picsum.photos/100/100?random=${workId}-${i + 1}`,
    order: i + 1,
    width: 1920,
    height: 1080,
    fileSize: 500000,
    // 캡션 예시 (일부만 캡션 추가)
    caption: i === 0 ? `<p>이 작업은 <a href="/works/work-003" data-work-id="work-003" data-work-title="푸른 하늘">푸른 하늘</a>에서 영감을 받았습니다.</p>` : undefined,
  }));
};

// 더미 작업 데이터 (공개된 작업만 포함)
export const mockWorks: Work[] = [
  {
    id: 'work-001',
    title: '아름다운 바다',
    shortDescription: '바다에서 영감을 받은 작업',
    fullDescription: '이 작업은 제주도 바다에서 본 풍경을 재해석한 작업입니다. 파도의 리듬과 하늘의 색채가 만나는 순간을 포착했습니다.',
    thumbnailImageId: 'img-work-001-1',
    images: createMockImages('work-001', 3),
    sentenceCategoryIds: ['key-001', 'key-002'],
    textCategoryIds: ['text-001'],
    isPublished: true,
    viewCount: 150,
    createdAt: new Date('2025-10-15'),
    updatedAt: new Date('2025-10-20'),
    publishedAt: new Date('2025-10-15'),
  },
  {
    id: 'work-003',
    title: '푸른 하늘',
    shortDescription: '하늘의 다양한 표정',
    fullDescription: '하늘의 다양한 표정을 담아낸 작품입니다. 구름의 변화와 빛의 조화를 통해 시간의 흐름을 표현했습니다.',
    thumbnailImageId: 'img-work-003-1',
    images: createMockImages('work-003', 4),
    sentenceCategoryIds: ['key-001'],
    textCategoryIds: ['text-001', 'text-003'],
    isPublished: true,
    viewCount: 230,
    createdAt: new Date('2025-10-05'),
    updatedAt: new Date('2025-10-08'),
    publishedAt: new Date('2025-10-05'),
  },
  {
    id: 'work-004',
    title: '불꽃의 춤',
    shortDescription: '불꽃의 역동적인 움직임',
    fullDescription: '불꽃의 역동적인 움직임과 색채의 변화를 포착한 작품입니다. 열기의 표현과 색채의 조화를 통해 생명력 있는 이미지를 만들어냈습니다.',
    thumbnailImageId: 'img-work-004-1',
    images: createMockImages('work-004', 6),
    sentenceCategoryIds: ['key-004'],
    textCategoryIds: ['text-003'],
    isPublished: true,
    viewCount: 180,
    createdAt: new Date('2025-09-28'),
    updatedAt: new Date('2025-10-01'),
    publishedAt: new Date('2025-09-28'),
  },
];

// 더미 문장형 카테고리 데이터
export const mockSentenceCategories: SentenceCategory[] = [
  {
    id: 'sent-001',
    sentence: '물은 아름다운 불과 같다',
    keywords: [
      {
        id: 'key-001',
        name: '물',
        startIndex: 0,
        endIndex: 1,
        workOrders: [
          { workId: 'work-001', order: 1 },
          { workId: 'work-003', order: 2 },
        ],
      },
      {
        id: 'key-002',
        name: '아름다운',
        startIndex: 3,
        endIndex: 7,
        workOrders: [
          { workId: 'work-001', order: 1 },
        ],
      },
      {
        id: 'key-004',
        name: '불',
        startIndex: 8,
        endIndex: 9,
        workOrders: [
          { workId: 'work-004', order: 1 },
        ],
      },
    ],
    displayOrder: 1,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'sent-002',
    sentence: '고요함 속에 소리가 있다',
    keywords: [
      {
        id: 'key-003',
        name: '고요함',
        startIndex: 0,
        endIndex: 3,
        workOrders: [],
      },
    ],
    displayOrder: 2,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

// 더미 텍스트형 카테고리 데이터
export const mockTextCategories: TextCategory[] = [
  {
    id: 'text-001',
    name: '디자인',
    displayOrder: 1,
    workOrders: [
      { workId: 'work-001', order: 1 },
      { workId: 'work-003', order: 2 },
    ],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'text-002',
    name: '조각',
    displayOrder: 2,
    workOrders: [],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'text-003',
    name: '추상',
    displayOrder: 3,
    workOrders: [
      { workId: 'work-003', order: 1 },
      { workId: 'work-004', order: 2 },
    ],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

// 유틸리티 함수: 키워드 ID로 작품 필터링
export const getWorksByKeywordId = (keywordId: string): Work[] => {
  const category = mockSentenceCategories
    .flatMap((cat) => cat.keywords)
    .find((kw) => kw.id === keywordId);
  if (!category) return [];
  return category.workOrders
    .map((order) => mockWorks.find((w) => w.id === order.workId))
    .filter((w): w is Work => w !== undefined && w.isPublished)
    .sort((a, b) => {
      const aOrder = category.workOrders.find((o) => o.workId === a.id)?.order || 0;
      const bOrder = category.workOrders.find((o) => o.workId === b.id)?.order || 0;
      return aOrder - bOrder;
    });
};

// 유틸리티 함수: 텍스트 카테고리 ID로 작품 필터링
export const getWorksByTextCategoryId = (categoryId: string): Work[] => {
  const category = mockTextCategories.find((cat) => cat.id === categoryId);
  if (!category) return [];
  return category.workOrders
    .map((order) => mockWorks.find((w) => w.id === order.workId))
    .filter((w): w is Work => w !== undefined && w.isPublished)
    .sort((a, b) => {
      const aOrder = category.workOrders.find((o) => o.workId === a.id)?.order || 0;
      const bOrder = category.workOrders.find((o) => o.workId === b.id)?.order || 0;
      return aOrder - bOrder;
    });
};

// 유틸리티 함수: 작품 ID로 작품 조회
export const getWorkById = (workId: string): Work | undefined => {
  return mockWorks.find((w) => w.id === workId && w.isPublished);
};

// 유틸리티 함수: 키워드 ID로 키워드 정보 조회
export const getKeywordById = (keywordId: string): KeywordCategory | undefined => {
  for (const category of mockSentenceCategories) {
    const keyword = category.keywords.find((kw) => kw.id === keywordId);
    if (keyword) return keyword;
  }
  return undefined;
};

// 유틸리티 함수: 키워드 ID로 문장 정보 조회
export const getSentenceByKeywordId = (keywordId: string): SentenceCategory | undefined => {
  return mockSentenceCategories.find((cat) =>
    cat.keywords.some((kw) => kw.id === keywordId)
  );
};

