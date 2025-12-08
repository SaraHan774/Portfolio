// 하드코딩된 가짜 데이터
import type { Work, SentenceCategory, ExhibitionCategory, User, WorkImage } from '../types';

// 더미 사용자 데이터
export const mockUser: User = {
  id: 'user-001',
  email: 'admin@example.com',
  googleId: 'google-123',
  displayName: '홍길동',
  profileImage: undefined,
  role: 'admin',
  createdAt: new Date('2024-01-01'),
  lastLoginAt: new Date(),
};

// 더미 작업 이미지 데이터
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
  }));
};

// 더미 작업 데이터
export const mockWorks: Work[] = [
  {
    id: 'work-001',
    title: '아름다운 바다',
    shortDescription: '바다에서 영감을 받은 작업',
    fullDescription: '이 작업은 제주도 바다에서 본 풍경을 재해석한 작업입니다. 파도의 리듬과 하늘의 색채가 만나는 순간을 포착했습니다.',
    thumbnailImageId: 'img-work-001-1',
    images: createMockImages('work-001', 3),
    sentenceCategoryIds: ['key-001', 'key-002'],
    exhibitionCategoryIds: ['exhibition-001'],
    isPublished: true,
    viewCount: 150,
    createdAt: new Date('2025-10-15'),
    updatedAt: new Date('2025-10-20'),
    publishedAt: new Date('2025-10-15'),
  },
  {
    id: 'work-002',
    title: '고요한 산',
    shortDescription: '산의 고요함을 표현한 작품',
    fullDescription: '산의 고요함과 자연의 힘을 동시에 표현하고자 했습니다. 돌의 질감과 하늘의 대비를 통해 정적이면서도 역동적인 이미지를 추구했습니다.',
    thumbnailImageId: 'img-work-002-1',
    images: createMockImages('work-002', 5),
    sentenceCategoryIds: ['key-003'],
    exhibitionCategoryIds: ['exhibition-002', 'exhibition-003'],
    isPublished: false,
    createdAt: new Date('2025-10-10'),
    updatedAt: new Date('2025-10-12'),
  },
  {
    id: 'work-003',
    title: '푸른 하늘',
    shortDescription: '하늘의 다양한 표정',
    fullDescription: '하늘의 다양한 표정을 담아낸 작품입니다. 구름의 변화와 빛의 조화를 통해 시간의 흐름을 표현했습니다.',
    thumbnailImageId: 'img-work-003-1',
    images: createMockImages('work-003', 4),
    sentenceCategoryIds: ['key-001'],
    exhibitionCategoryIds: ['exhibition-001', 'exhibition-003'],
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
    exhibitionCategoryIds: ['exhibition-003'],
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
    sentenceCategoryIds: ['key-001', 'key-002'],
    exhibitionCategoryIds: ['exhibition-001'],
    isPublished: false,
    createdAt: new Date('2025-09-20'),
    updatedAt: new Date('2025-09-22'),
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
        ],
      },
      {
        id: 'key-002',
        name: '아름다운',
        startIndex: 3,
        endIndex: 7,
        workOrders: [
          { workId: 'work-001', order: 1 },
          { workId: 'work-005', order: 2 },
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
        workOrders: [
          { workId: 'work-002', order: 1 },
        ],
      },
    ],
    displayOrder: 2,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

// 더미 전시명 카테고리 데이터
export const mockExhibitionCategories: ExhibitionCategory[] = [
  {
    id: 'exhibition-001',
    title: 'Cushioning Attack',
    description: {
      exhibitionType: '2인전',
      venue: 'YPCSpace',
      year: 2023,
    },
    displayOrder: 1,
    workOrders: [
      { workId: 'work-001', order: 1 },
      { workId: 'work-003', order: 2 },
      { workId: 'work-005', order: 3 },
    ],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'exhibition-002',
    title: 'Silent Echo',
    description: {
      exhibitionType: '개인전',
      venue: 'Gallery H',
      year: 2022,
    },
    displayOrder: 2,
    workOrders: [
      { workId: 'work-002', order: 1 },
    ],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'exhibition-003',
    title: 'Wave Form',
    description: {
      exhibitionType: '그룹전',
      venue: 'Art Center',
      year: 2024,
    },
    displayOrder: 3,
    workOrders: [
      { workId: 'work-002', order: 1 },
      { workId: 'work-003', order: 2 },
      { workId: 'work-004', order: 3 },
    ],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

// 하위 호환성을 위한 별칭 (deprecated)
export const mockTextCategories = mockExhibitionCategories;

