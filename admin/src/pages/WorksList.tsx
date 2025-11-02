// 작업 목록 페이지 컴포넌트
import { useState, useMemo, useEffect } from 'react';
import {
  Typography,
  Table,
  List,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Switch,
  Card,
  Image,
  message,
  Popconfirm,
  Drawer,
  Avatar,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  LockOutlined,
  UnlockOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { mockWorks, mockTextCategories, mockSentenceCategories } from '../services/mockData';
import type { Work } from '../types';
import './WorksList.css';

const { Title } = Typography;

const WorksList = () => {
  const navigate = useNavigate();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [searchText, setSearchText] = useState('');
  const [debouncedSearchText, setDebouncedSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'latest' | 'oldest' | 'title'>('latest');
  const [isMobile, setIsMobile] = useState(false);
  const [batchDrawerOpen, setBatchDrawerOpen] = useState(false);

  // 모바일 여부 확인
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 검색 입력 디바운스 (500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchText]);

  // 작업 목록 조회
  const { data: works = [], refetch } = useQuery({
    queryKey: ['works'],
    queryFn: async () => mockWorks,
    staleTime: 5 * 60 * 1000,
  });

  // 카테고리 목록 조회 (필터용)
  const { data: allCategories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const textCats = mockTextCategories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        type: 'text' as const,
      }));
      const sentenceCats = mockSentenceCategories.flatMap((sent) =>
        sent.keywords.map((kw) => ({
          id: kw.id,
          name: kw.name,
          type: 'sentence' as const,
        }))
      );
      return [...textCats, ...sentenceCats];
    },
  });

  // 필터링 및 정렬된 작업 목록
  const filteredAndSortedWorks = useMemo(() => {
    let result = [...works];

    // 상태 필터
    if (statusFilter !== 'all') {
      result = result.filter((work) =>
        statusFilter === 'published' ? work.isPublished : !work.isPublished
      );
    }

    // 검색 필터 (디바운스된 검색어 사용)
    if (debouncedSearchText.trim()) {
      const lowerSearch = debouncedSearchText.toLowerCase();
      result = result.filter(
        (work) =>
          work.title.toLowerCase().includes(lowerSearch) ||
          work.shortDescription?.toLowerCase().includes(lowerSearch) ||
          work.fullDescription.toLowerCase().includes(lowerSearch)
      );
    }

    // 카테고리 필터
    if (categoryFilter.length > 0) {
      result = result.filter((work) => {
        const workCategoryIds = [...work.sentenceCategoryIds, ...work.textCategoryIds];
        return categoryFilter.some((catId) => workCategoryIds.includes(catId));
      });
    }

    // 정렬
    result.sort((a, b) => {
      switch (sortBy) {
        case 'latest':
          return b.updatedAt.getTime() - a.updatedAt.getTime();
        case 'oldest':
          return a.createdAt.getTime() - b.createdAt.getTime();
        case 'title':
          return a.title.localeCompare(b.title, 'ko');
        default:
          return 0;
      }
    });

    return result;
  }, [works, statusFilter, debouncedSearchText, categoryFilter, sortBy]);

  // 공개/비공개 토글 핸들러 (Optimistic Update)
  const handleTogglePublish = async (workId: string, checked: boolean) => {
    // Optimistic Update: 즉시 UI 업데이트
    const work = works.find((w) => w.id === workId);
    if (work) {
      work.isPublished = checked;
    }
    
    try {
      // 실제로는 API 호출
      // await updateWorkStatus(workId, checked);
      
      // 성공 시 토스트 메시지
      message.success(`${checked ? '공개' : '비공개'}로 변경되었습니다.`);
      
      // 서버 상태 동기화 (실제 구현 시)
      await refetch();
    } catch (error) {
      // 실패 시 롤백
      if (work) {
        work.isPublished = !checked;
      }
      message.error('상태 변경에 실패했습니다.');
      await refetch();
    }
  };

  // 작업 삭제 핸들러
  const handleDelete = async (_workId: string) => {
    message.success('작업이 삭제되었습니다.');
    await refetch();
  };

  // 일괄 작업 핸들러
  const handleBatchAction = async (action: 'publish' | 'unpublish' | 'delete') => {
    if (selectedRowKeys.length === 0) {
      message.warning('선택된 작업이 없습니다.');
      return;
    }

    switch (action) {
      case 'publish':
        message.success(`${selectedRowKeys.length}개 작업을 공개로 변경했습니다.`);
        break;
      case 'unpublish':
        message.success(`${selectedRowKeys.length}개 작업을 비공개로 변경했습니다.`);
        break;
      case 'delete':
        message.success(`${selectedRowKeys.length}개 작업을 삭제했습니다.`);
        break;
    }
    setSelectedRowKeys([]);
    await refetch();
  };

  // 테이블 컬럼 정의
  const columns: ColumnsType<Work> = [
    {
      title: '썸네일',
      dataIndex: 'thumbnailImageId',
      key: 'thumbnail',
      width: 100,
      render: (_, record) => {
        const thumbnailImage = record.images.find((img) => img.id === record.thumbnailImageId);
        return (
          <Image
            src={thumbnailImage?.thumbnailUrl || thumbnailImage?.url}
            alt={record.title}
            width={80}
            height={80}
            style={{ objectFit: 'cover', borderRadius: '4px' }}
            fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOGM4YzhjIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2U8L3RleHQ+PC9zdmc+"
          />
        );
      },
    },
    {
      title: '작업명',
      dataIndex: 'title',
      key: 'title',
      sorter: true,
      render: (text, record) => (
        <Space direction="vertical" size="small">
          <strong>{text}</strong>
          <span style={{ color: '#8c8c8c', fontSize: '12px' }}>
            {record.shortDescription || record.fullDescription.substring(0, 50)}...
          </span>
        </Space>
      ),
    },
    {
      title: '카테고리',
      dataIndex: 'textCategoryIds',
      key: 'categories',
      width: 200,
      render: (_, record) => {
        const categories = [
          ...record.sentenceCategoryIds.map((id) => {
            const keyword = mockSentenceCategories
              .flatMap((s) => s.keywords)
              .find((k) => k.id === id);
            return keyword?.name || '';
          }),
          ...record.textCategoryIds.map((id) => {
            const cat = mockTextCategories.find((c) => c.id === id);
            return cat?.name || '';
          }),
        ].filter(Boolean);

        return (
          <Space wrap>
            {categories.map((cat, idx) => (
              <Tag key={idx} color="blue">
                {cat}
              </Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: '공개 상태',
      dataIndex: 'isPublished',
      key: 'status',
      width: 120,
      render: (isPublished, record) => (
        <Switch
          checked={isPublished}
          checkedChildren="공개"
          unCheckedChildren="비공개"
          onChange={(checked) => handleTogglePublish(record.id, checked)}
        />
      ),
    },
    {
      title: '수정일',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 120,
      sorter: true,
      render: (date: Date) => date.toLocaleDateString('ko-KR'),
    },
    {
      title: '작업',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => navigate(`/works/${record.id}`)}
          >
            편집
          </Button>
          <Popconfirm
            title="정말 삭제하시겠습니까?"
            onConfirm={() => handleDelete(record.id)}
            okText="삭제"
            cancelText="취소"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              삭제
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 행 선택 설정
  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => {
      setSelectedRowKeys(keys);
    },
  };

  return (
    <div className="works-list">
      <Title level={2}><AppstoreOutlined /> 작업 관리</Title>

      {/* 툴바 */}
      <Card style={{ marginBottom: '16px' }}>
        {isMobile ? (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Space wrap style={{ width: '100%' }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/works/new')}
                block
              >
                새 작업
              </Button>
              <Button icon={<EyeOutlined />} onClick={() => window.open('/preview', '_blank')} block>
                미리보기
              </Button>
            </Space>
            <Input
              placeholder="검색..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: '100%' }}
              options={[
                { label: '필터: 전체', value: 'all' },
                { label: '공개', value: 'published' },
                { label: '비공개', value: 'draft' },
              ]}
            />
            <Select
              placeholder="카테고리"
              mode="multiple"
              value={categoryFilter}
              onChange={setCategoryFilter}
              style={{ width: '100%' }}
              options={allCategories.map((cat) => ({
                label: cat.name,
                value: cat.id,
              }))}
              allowClear
            />
            <Select
              value={sortBy}
              onChange={setSortBy}
              style={{ width: '100%' }}
              options={[
                { label: '최신순', value: 'latest' },
                { label: '오래된순', value: 'oldest' },
                { label: '제목순', value: 'title' },
              ]}
            />
          </Space>
        ) : (
          <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space wrap>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/works/new')}>
                새 작업
              </Button>
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: 150 }}
                options={[
                  { label: '필터: 전체', value: 'all' },
                  { label: '공개', value: 'published' },
                  { label: '비공개', value: 'draft' },
                ]}
              />
              <Input
                placeholder="검색..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 200 }}
                allowClear
              />
              <Select
                placeholder="카테고리"
                mode="multiple"
                value={categoryFilter}
                onChange={setCategoryFilter}
                style={{ width: 200 }}
                options={allCategories.map((cat) => ({
                  label: cat.name,
                  value: cat.id,
                }))}
                allowClear
              />
              <Select
                value={sortBy}
                onChange={setSortBy}
                style={{ width: 150 }}
                options={[
                  { label: '최신순', value: 'latest' },
                  { label: '오래된순', value: 'oldest' },
                  { label: '제목순', value: 'title' },
                ]}
              />
            </Space>
            <Button icon={<EyeOutlined />} onClick={() => window.open('/preview', '_blank')}>
              미리보기
            </Button>
          </Space>
        )}
      </Card>

      {/* 일괄 작업 영역 - 데스크탑 */}
      {selectedRowKeys.length > 0 && !isMobile && (
        <Card style={{ marginBottom: '16px', background: '#f0f0f0' }}>
          <Space>
            <span>선택된 항목 ({selectedRowKeys.length}개):</span>
            <Button onClick={() => handleBatchAction('publish')}>일괄 공개</Button>
            <Button onClick={() => handleBatchAction('unpublish')}>일괄 비공개</Button>
            <Popconfirm
              title={`정말 ${selectedRowKeys.length}개 작업을 삭제하시겠습니까?`}
              onConfirm={() => handleBatchAction('delete')}
              okText="삭제"
              cancelText="취소"
            >
              <Button danger>일괄 삭제</Button>
            </Popconfirm>
          </Space>
        </Card>
      )}

      {/* 모바일 - 선택된 항목 표시 */}
      {selectedRowKeys.length > 0 && isMobile && (
        <Button
          type="primary"
          block
          style={{ marginBottom: '16px' }}
          onClick={() => setBatchDrawerOpen(true)}
        >
          선택된 항목 ({selectedRowKeys.length}개) 관리
        </Button>
      )}

      {/* 데스크탑 - 테이블 */}
      {!isMobile && (
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={filteredAndSortedWorks}
          rowKey="id"
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `총 ${total}개`,
          }}
          scroll={{ x: 1200 }}
        />
      )}

      {/* 모바일 - 리스트 */}
      {isMobile && (
        <List
          dataSource={filteredAndSortedWorks}
          renderItem={(work) => {
            const thumbnailImage = work.images.find((img) => img.id === work.thumbnailImageId);
            const categories = [
              ...work.sentenceCategoryIds.map((id) => {
                const keyword = mockSentenceCategories
                  .flatMap((s) => s.keywords)
                  .find((k) => k.id === id);
                return keyword?.name || '';
              }),
              ...work.textCategoryIds.map((id) => {
                const cat = mockTextCategories.find((c) => c.id === id);
                return cat?.name || '';
              }),
            ].filter(Boolean);

            const isSelected = selectedRowKeys.includes(work.id);
            return (
              <Card
                key={work.id}
                style={{ marginBottom: '12px', borderRadius: '8px' }}
                styles={{ body: { padding: '12px' } }}
              >
                {/* 체크박스 */}
                <div style={{ marginBottom: '12px' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      padding: '8px',
                      margin: '-8px',
                      minWidth: '44px',
                      minHeight: '44px',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isSelected) {
                        setSelectedRowKeys(selectedRowKeys.filter((key) => key !== work.id));
                      } else {
                        setSelectedRowKeys([...selectedRowKeys, work.id]);
                      }
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        e.stopPropagation();
                        if (e.target.checked) {
                          setSelectedRowKeys([...selectedRowKeys, work.id]);
                        } else {
                          setSelectedRowKeys(selectedRowKeys.filter((key) => key !== work.id));
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        width: '24px',
                        height: '24px',
                        cursor: 'pointer',
                        marginRight: '12px',
                      }}
                    />
                  </label>
                </div>

                {/* 작업 정보 */}
                <div
                  onClick={() => navigate(`/works/${work.id}`)}
                  style={{ cursor: 'pointer', marginBottom: '12px' }}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        shape="square"
                        size={64}
                        src={thumbnailImage?.thumbnailUrl || thumbnailImage?.url}
                      />
                    }
                    title={work.title}
                    description={
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <span>{work.shortDescription || work.fullDescription.substring(0, 50)}...</span>
                        <Space wrap>
                          {categories.map((cat, idx) => (
                            <Tag key={idx} color="blue" style={{ fontSize: '11px' }}>
                              {cat}
                            </Tag>
                          ))}
                        </Space>
                        <span style={{ color: '#8c8c8c', fontSize: '12px' }}>
                          {work.updatedAt.toLocaleDateString('ko-KR')}
                        </span>
                      </Space>
                    }
                  />
                </div>

                {/* 액션 버튼들 - 가로 배치 */}
                <Space style={{ width: '100%' }} size="middle">
                  <Button
                    block
                    icon={<EditOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/works/${work.id}`);
                    }}
                    style={{ minHeight: '44px', flex: 1 }}
                  >
                    편집
                  </Button>
                  <Popconfirm
                    title="정말 삭제하시겠습니까?"
                    onConfirm={() => handleDelete(work.id)}
                    okText="삭제"
                    cancelText="취소"
                  >
                    <Button
                      block
                      danger
                      icon={<DeleteOutlined />}
                      onClick={(e) => e.stopPropagation()}
                      style={{ minHeight: '44px', flex: 1 }}
                    >
                      삭제
                    </Button>
                  </Popconfirm>
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTogglePublish(work.id, !work.isPublished);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      padding: '0 4px',
                    }}
                  >
                    <Switch
                      checked={work.isPublished}
                      checkedChildren={<UnlockOutlined style={{ fontSize: '12px' }} />}
                      unCheckedChildren={<LockOutlined style={{ fontSize: '12px' }} />}
                      onChange={(checked) => {
                        handleTogglePublish(work.id, checked);
                      }}
                    />
                  </div>
                </Space>
              </Card>
            );
          }}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total) => `총 ${total}개`,
          }}
        />
      )}

      {/* 모바일 - 일괄 작업 Drawer */}
      {isMobile && (
        <Drawer
          title={`선택된 항목 (${selectedRowKeys.length}개)`}
          placement="bottom"
          height={300}
          open={batchDrawerOpen}
          onClose={() => setBatchDrawerOpen(false)}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Button block onClick={() => handleBatchAction('publish')}>
              일괄 공개
            </Button>
            <Button block onClick={() => handleBatchAction('unpublish')}>
              일괄 비공개
            </Button>
            <Popconfirm
              title={`정말 ${selectedRowKeys.length}개 작업을 삭제하시겠습니까?`}
              onConfirm={() => {
                handleBatchAction('delete');
                setBatchDrawerOpen(false);
              }}
              okText="삭제"
              cancelText="취소"
            >
              <Button block danger>
                일괄 삭제
              </Button>
            </Popconfirm>
            <Button block onClick={() => setBatchDrawerOpen(false)}>
              취소
            </Button>
          </Space>
        </Drawer>
      )}
    </div>
  );
};

export default WorksList;
