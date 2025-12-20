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
  Spin,
  notification,
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
  LoadingOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useWorks, useUpdateWork, useDeleteWork } from '../domain';
import { useSentenceCategories, useExhibitionCategories } from '../domain';
import type { Work } from '../core/types';
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingMessage, setDeletingMessage] = useState('');

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

  // 작업 목록 조회 (Firebase)
  const { data: works = [], isLoading: isWorksLoading } = useWorks();

  // 카테고리 목록 조회 (Firebase)
  const { data: sentenceCategories = [] } = useSentenceCategories();
  const { data: exhibitionCategories = [] } = useExhibitionCategories();

  // 필터용 카테고리 목록 생성
  const allCategories = useMemo(() => {
    const exhibitionCats = exhibitionCategories.map((cat) => ({
      id: cat.id,
      name: cat.title,
      type: 'exhibition' as const,
    }));
    const sentenceCats = sentenceCategories.flatMap((sent) =>
      sent.keywords.map((kw) => ({
        id: kw.id,
        name: kw.name,
        type: 'sentence' as const,
      }))
    );
    return [...exhibitionCats, ...sentenceCats];
  }, [exhibitionCategories, sentenceCategories]);

  // Firebase 뮤테이션 훅
  const updateWorkMutation = useUpdateWork();
  const deleteWorkMutation = useDeleteWork();

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
          work.fullDescription?.toLowerCase().includes(lowerSearch) ||
          work.caption?.toLowerCase().includes(lowerSearch)
      );
    }

    // 카테고리 필터
    if (categoryFilter.length > 0) {
      result = result.filter((work) => {
        const workCategoryIds = [...work.sentenceCategoryIds, ...work.exhibitionCategoryIds];
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

  // 공개/비공개 토글 핸들러 (Firebase)
  const handleTogglePublish = async (workId: string, checked: boolean) => {
    try {
      await updateWorkMutation.mutateAsync({
        id: workId,
        updates: { isPublished: checked },
      });
      message.success(`${checked ? '공개' : '비공개'}로 변경되었습니다.`);
    } catch {
      message.error('상태 변경에 실패했습니다.');
    }
  };

  // 작업 삭제 핸들러 (Firebase + Storage)
  const handleDelete = async (workId: string) => {
    // 삭제할 작업 찾기
    const workToDelete = works.find((w) => w.id === workId);
    const imageCount = workToDelete?.images.length || 0;

    setIsDeleting(true);
    setDeletingMessage(imageCount > 0
      ? `작업과 이미지 ${imageCount}개를 삭제하는 중...`
      : '작업을 삭제하는 중...'
    );

    try {
      await deleteWorkMutation.mutateAsync(workId);

      setIsDeleting(false);
      setDeletingMessage('');

      notification.success({
        message: '삭제 완료',
        description: imageCount > 0
          ? `작업과 Storage 이미지 ${imageCount}개가 삭제되었습니다.`
          : '작업이 삭제되었습니다.',
        icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
        placement: 'topRight',
      });
    } catch {
      setIsDeleting(false);
      setDeletingMessage('');

      notification.error({
        message: '삭제 실패',
        description: '작업 삭제에 실패했습니다. 다시 시도해주세요.',
        placement: 'topRight',
      });
    }
  };

  // 일괄 작업 핸들러 (Firebase)
  const handleBatchAction = async (action: 'publish' | 'unpublish' | 'delete') => {
    if (selectedRowKeys.length === 0) {
      message.warning('선택된 작업이 없습니다.');
      return;
    }

    // 삭제의 경우 이미지 개수 계산
    const totalImageCount = action === 'delete'
      ? selectedRowKeys.reduce((count: number, key) => {
          const work = works.find((w) => w.id === String(key));
          return count + (work?.images.length || 0);
        }, 0)
      : 0;

    if (action === 'delete') {
      setIsDeleting(true);
      setDeletingMessage(
        totalImageCount > 0
          ? `${selectedRowKeys.length}개 작업과 이미지 ${totalImageCount}개를 삭제하는 중...`
          : `${selectedRowKeys.length}개 작업을 삭제하는 중...`
      );
    }

    try {
      const promises = selectedRowKeys.map((key) => {
        const id = String(key);
        switch (action) {
          case 'publish':
            return updateWorkMutation.mutateAsync({ id, updates: { isPublished: true } });
          case 'unpublish':
            return updateWorkMutation.mutateAsync({ id, updates: { isPublished: false } });
          case 'delete':
            return deleteWorkMutation.mutateAsync(id);
          default:
            return Promise.resolve();
        }
      });
      await Promise.all(promises);

      if (action === 'delete') {
        setIsDeleting(false);
        setDeletingMessage('');
      }

      switch (action) {
        case 'publish':
          notification.success({
            message: '일괄 공개 완료',
            description: `${selectedRowKeys.length}개 작업을 공개로 변경했습니다.`,
            icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
            placement: 'topRight',
          });
          break;
        case 'unpublish':
          notification.success({
            message: '일괄 비공개 완료',
            description: `${selectedRowKeys.length}개 작업을 비공개로 변경했습니다.`,
            icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
            placement: 'topRight',
          });
          break;
        case 'delete':
          notification.success({
            message: '일괄 삭제 완료',
            description: totalImageCount > 0
              ? `${selectedRowKeys.length}개 작업과 Storage 이미지 ${totalImageCount}개가 삭제되었습니다.`
              : `${selectedRowKeys.length}개 작업이 삭제되었습니다.`,
            icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
            placement: 'topRight',
          });
          break;
      }
      setSelectedRowKeys([]);
    } catch {
      if (action === 'delete') {
        setIsDeleting(false);
        setDeletingMessage('');
      }
      notification.error({
        message: '일괄 작업 실패',
        description: '일괄 작업에 실패했습니다. 다시 시도해주세요.',
        placement: 'topRight',
      });
    }
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
          {(record.shortDescription || record.fullDescription || record.caption) && (
            <span style={{ color: '#8c8c8c', fontSize: '12px' }}>
              {(record.shortDescription || record.fullDescription || record.caption || '').substring(0, 50)}...
            </span>
          )}
        </Space>
      ),
    },
    {
      title: '카테고리',
      dataIndex: 'exhibitionCategoryIds',
      key: 'categories',
      width: 200,
      render: (_, record) => {
        const categories = [
          ...record.sentenceCategoryIds.map((id) => {
            const keyword = sentenceCategories
              .flatMap((s) => s.keywords)
              .find((k) => k.id === id);
            return keyword?.name || '';
          }),
          ...record.exhibitionCategoryIds.map((id) => {
            const cat = exhibitionCategories.find((c) => c.id === id);
            return cat?.title || '';
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

  // 로딩 상태
  if (isWorksLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Spin size="large" tip="작업 목록을 불러오는 중..." />
      </div>
    );
  }

  return (
    <div className="works-list">
      {/* 삭제 중 로딩 오버레이 */}
      {isDeleting && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(255, 255, 255, 0.9)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          }}
        >
          <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} size="large" />
          <div style={{ marginTop: '24px', fontSize: '18px', color: '#ff4d4f', fontWeight: 500 }}>
            {deletingMessage}
          </div>
          <div style={{ marginTop: '8px', fontSize: '14px', color: '#8c8c8c' }}>
            Storage 이미지도 함께 삭제됩니다...
          </div>
        </div>
      )}

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
                const keyword = sentenceCategories
                  .flatMap((s) => s.keywords)
                  .find((k) => k.id === id);
                return keyword?.name || '';
              }),
              ...work.exhibitionCategoryIds.map((id) => {
                const cat = exhibitionCategories.find((c) => c.id === id);
                return cat?.title || '';
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
                        <span>{(work.shortDescription || work.fullDescription || work.caption || '').substring(0, 50)}...</span>
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
