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
    id: 'work-002',
    title: '산의 고요함',
    shortDescription: '산의 고요함을 표현한 작품',
    fullDescription: '산의 고요함과 자연의 힘을 동시에 표현하고자 했습니다. 돌의 질감과 하늘의 대비를 통해 정적이면서도 역동적인 이미지를 추구했습니다.',
    thumbnailImageId: 'img-work-002-1',
    images: createMockImages('work-002', 5),
    sentenceCategoryIds: ['key-003'],
    textCategoryIds: ['text-002'],
    isPublished: true,
    viewCount: 120,
    createdAt: new Date('2025-10-10'),
    updatedAt: new Date('2025-10-12'),
    publishedAt: new Date('2025-10-10'),
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
  {
    id: 'work-005',
    title: '물의 흐름',
    shortDescription: '물의 자연스러운 흐름',
    fullDescription: '물의 자연스러운 흐름과 투명함을 표현한 작품입니다. 빛과 물의 만남에서 나오는 다양한 효과를 담아냈습니다.',
    thumbnailImageId: 'img-work-005-1',
    images: createMockImages('work-005', 3),
    sentenceCategoryIds: ['key-001'],
    textCategoryIds: ['text-001'],
    isPublished: true,
    viewCount: 195,
    createdAt: new Date('2025-09-20'),
    updatedAt: new Date('2025-09-22'),
    publishedAt: new Date('2025-09-20'),
  },
  {
    id: 'work-006',
    title: '바람의 흔적',
    shortDescription: '바람이 남긴 흔적들',
    fullDescription: '보이지 않는 바람의 흔적을 시각화한 작품입니다. 자연의 움직임과 변화를 정적 이미지로 포착했습니다.',
    thumbnailImageId: 'img-work-006-1',
    images: createMockImages('work-006', 4),
    sentenceCategoryIds: ['key-001'],
    textCategoryIds: ['text-003'],
    isPublished: true,
    viewCount: 165,
    createdAt: new Date('2025-09-15'),
    updatedAt: new Date('2025-09-18'),
    publishedAt: new Date('2025-09-15'),
  },
  {
    id: 'work-007',
    title: '아름다운 순간',
    shortDescription: '일상 속 아름다운 순간',
    fullDescription: '일상 속에서 발견한 아름다운 순간들을 기록한 작품입니다. 평범한 것들의 특별함을 재발견합니다.',
    thumbnailImageId: 'img-work-007-1',
    images: createMockImages('work-007', 5),
    sentenceCategoryIds: ['key-002'],
    textCategoryIds: ['text-001'],
    isPublished: true,
    viewCount: 210,
    createdAt: new Date('2025-09-10'),
    updatedAt: new Date('2025-09-12'),
    publishedAt: new Date('2025-09-10'),
  },
  {
    id: 'work-008',
    title: '고요한 밤',
    shortDescription: '밤의 고요함',
    fullDescription: '밤의 고요함과 어둠 속에서 느껴지는 평온함을 표현한 작품입니다. 조용함 속에서 발견하는 내면의 소리를 담았습니다.',
    thumbnailImageId: 'img-work-008-1',
    images: createMockImages('work-008', 4),
    sentenceCategoryIds: ['key-003'],
    textCategoryIds: ['text-002', 'text-003'],
    isPublished: true,
    viewCount: 145,
    createdAt: new Date('2025-09-05'),
    updatedAt: new Date('2025-09-07'),
    publishedAt: new Date('2025-09-05'),
  },
  {
    id: 'work-009',
    title: '빛과 그림자',
    shortDescription: '빛과 그림자의 대비',
    fullDescription: '빛과 그림자의 대비를 통해 형태와 공간을 탐구한 작품입니다. 명암의 조화로 입체감을 표현했습니다.',
    thumbnailImageId: 'img-work-009-1',
    images: createMockImages('work-009', 6),
    sentenceCategoryIds: ['key-004'],
    textCategoryIds: ['text-003'],
    isPublished: true,
    viewCount: 175,
    createdAt: new Date('2025-08-28'),
    updatedAt: new Date('2025-09-01'),
    publishedAt: new Date('2025-08-28'),
  },
  {
    id: 'work-010',
    title: '물결의 리듬',
    shortDescription: '물결의 반복되는 리듬',
    fullDescription: '물결의 반복되는 리듬과 패턴을 추상적으로 표현한 작품입니다. 자연의 리듬감을 시각적으로 전달합니다.',
    thumbnailImageId: 'img-work-010-1',
    images: createMockImages('work-010', 3),
    sentenceCategoryIds: ['key-001'],
    textCategoryIds: ['text-001', 'text-003'],
    isPublished: true,
    viewCount: 160,
    createdAt: new Date('2025-08-20'),
    updatedAt: new Date('2025-08-22'),
    publishedAt: new Date('2025-08-20'),
  },
  {
    id: 'work-011',
    title: '불의 열기',
    shortDescription: '불의 따뜻한 열기',
    fullDescription: '불의 따뜻한 열기와 생동감을 표현한 작품입니다. 색채의 변화와 움직임을 통해 생명력을 전달합니다.',
    thumbnailImageId: 'img-work-011-1',
    images: createMockImages('work-011', 5),
    sentenceCategoryIds: ['key-004'],
    textCategoryIds: ['text-003'],
    isPublished: true,
    viewCount: 188,
    createdAt: new Date('2025-08-15'),
    updatedAt: new Date('2025-08-17'),
    publishedAt: new Date('2025-08-15'),
  },
  {
    id: 'work-012',
    title: '소리의 파동',
    shortDescription: '고요함 속의 소리',
    fullDescription: '고요함 속에서 들리는 미묘한 소리를 시각화한 작품입니다. 조용함과 소리의 대비를 통해 공간감을 표현했습니다.',
    thumbnailImageId: 'img-work-012-1',
    images: createMockImages('work-012', 4),
    sentenceCategoryIds: ['key-003'],
    textCategoryIds: ['text-002'],
    isPublished: true,
    viewCount: 142,
    createdAt: new Date('2025-08-10'),
    updatedAt: new Date('2025-08-12'),
    publishedAt: new Date('2025-08-10'),
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
          { workId: 'work-005', order: 3 },
          { workId: 'work-006', order: 4 },
          { workId: 'work-010', order: 5 },
        ],
      },
      {
        id: 'key-002',
        name: '아름다운',
        startIndex: 3,
        endIndex: 7,
        workOrders: [
          { workId: 'work-001', order: 1 },
          { workId: 'work-007', order: 2 },
        ],
      },
      {
        id: 'key-004',
        name: '불',
        startIndex: 8,
        endIndex: 9,
        workOrders: [
          { workId: 'work-004', order: 1 },
          { workId: 'work-009', order: 2 },
          { workId: 'work-011', order: 3 },
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
        workOrders: [
          { workId: 'work-002', order: 1 },
          { workId: 'work-008', order: 2 },
          { workId: 'work-012', order: 3 },
        ],
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
    name: '현대적인 디자인과 실용성의 조화를 추구하는 작품들',
    displayOrder: 1,
    workOrders: [
      { workId: 'work-001', order: 1 },
      { workId: 'work-003', order: 2 },
      { workId: 'work-005', order: 3 },
      { workId: 'work-007', order: 4 },
      { workId: 'work-010', order: 5 },
    ],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'text-002',
    name: '공간과 형태의 관계를 탐구하는 조각 작품',
    displayOrder: 2,
    workOrders: [
      { workId: 'work-002', order: 1 },
      { workId: 'work-008', order: 2 },
      { workId: 'work-012', order: 3 },
    ],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'text-003',
    name: '색채와 형태의 자유로운 표현을 담은 추상 작품',
    displayOrder: 3,
    workOrders: [
      { workId: 'work-003', order: 1 },
      { workId: 'work-004', order: 2 },
      { workId: 'work-006', order: 3 },
      { workId: 'work-008', order: 4 },
      { workId: 'work-009', order: 5 },
      { workId: 'work-010', order: 6 },
      { workId: 'work-011', order: 7 },
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

