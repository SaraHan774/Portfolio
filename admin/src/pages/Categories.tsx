// 카테고리 관리 페이지 컴포넌트
import { useState, useEffect, useCallback } from 'react';
import {
  Typography,
  Card,
  Button,
  Space,
  Modal,
  Form,
  Input,
  message,
  Popconfirm,
  Tag,
  Collapse,
  Spin,
  Divider,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  DragOutlined,
  FolderOutlined,
  FileTextOutlined,
  HighlightOutlined,
} from '@ant-design/icons';
import {
  useSentenceCategories,
  useExhibitionCategories,
  useCreateSentenceCategory,
  useUpdateSentenceCategory,
  useDeleteSentenceCategory,
  useCreateExhibitionCategory,
  useUpdateExhibitionCategory,
  useDeleteExhibitionCategory,
  useUpdateCategoryOrders,
  useWorks,
} from '../domain';
import type { SentenceCategory, ExhibitionCategory, KeywordCategory } from '../core/types';
import './Categories.css';

const { Title } = Typography;

const Categories = () => {
  const [sentenceModalVisible, setSentenceModalVisible] = useState(false);
  const [exhibitionModalVisible, setExhibitionModalVisible] = useState(false);
  const [editingSentence, setEditingSentence] = useState<SentenceCategory | null>(null);
  const [editingExhibition, setEditingExhibition] = useState<ExhibitionCategory | null>(null);
  const [form] = Form.useForm();
  const [exhibitionForm] = Form.useForm();
  const [isMobile, setIsMobile] = useState(false);

  // 키워드 선택 관련 상태
  const [keywords, setKeywords] = useState<KeywordCategory[]>([]);
  const [sentenceText, setSentenceText] = useState('');

  // 모바일 여부 확인
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 문장형 카테고리 조회 (Firebase)
  const { data: sentenceCategories = [], isLoading: isSentenceLoading } = useSentenceCategories();

  // 전시명 카테고리 조회 (Firebase)
  const { data: exhibitionCategories = [], isLoading: isExhibitionLoading } = useExhibitionCategories();

  // 작업 목록 조회 (Firebase)
  const { data: works = [] } = useWorks();

  // Firebase 뮤테이션 훅
  const createSentenceMutation = useCreateSentenceCategory();
  const updateSentenceMutation = useUpdateSentenceCategory();
  const deleteSentenceMutation = useDeleteSentenceCategory();
  const createExhibitionMutation = useCreateExhibitionCategory();
  const updateExhibitionMutation = useUpdateExhibitionCategory();
  const deleteExhibitionMutation = useDeleteExhibitionCategory();
  const updateOrdersMutation = useUpdateCategoryOrders();

  // 작업 개수 계산 (키워드별)
  const getWorkCount = (keywordId: string) => {
    return works.filter((work) => work.sentenceCategoryIds.includes(keywordId)).length;
  };

  // 전시명 카테고리 작업 개수 계산
  const getExhibitionCategoryWorkCount = (categoryId: string) => {
    return works.filter((work) => work.exhibitionCategoryIds.includes(categoryId)).length;
  };

  // 문장형 카테고리 순서 변경 (Firebase)
  const handleMoveSentence = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === sentenceCategories.length - 1) return;

    const newCategories = [...sentenceCategories];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    [newCategories[index], newCategories[targetIndex]] = [newCategories[targetIndex], newCategories[index]];

    const orders = newCategories.map((cat, idx) => ({
      id: cat.id,
      displayOrder: idx + 1,
    }));

    try {
      await updateOrdersMutation.mutateAsync({ type: 'sentence', orders });
      message.success('순서가 변경되었습니다.');
    } catch {
      message.error('순서 변경에 실패했습니다.');
    }
  };

  // 전시명 카테고리 순서 변경 (Firebase)
  const handleMoveExhibition = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === exhibitionCategories.length - 1) return;

    const newCategories = [...exhibitionCategories];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    [newCategories[index], newCategories[targetIndex]] = [newCategories[targetIndex], newCategories[index]];

    const orders = newCategories.map((cat, idx) => ({
      id: cat.id,
      displayOrder: idx + 1,
    }));

    try {
      await updateOrdersMutation.mutateAsync({ type: 'exhibition', orders });
      message.success('순서가 변경되었습니다.');
    } catch {
      message.error('순서 변경에 실패했습니다.');
    }
  };

  // 문장형 카테고리 삭제 (Firebase)
  const handleDeleteSentence = async (categoryId: string) => {
    try {
      await deleteSentenceMutation.mutateAsync(categoryId);
      message.success('문장이 삭제되었습니다.');
    } catch {
      message.error('삭제에 실패했습니다.');
    }
  };

  // 전시명 카테고리 삭제 (Firebase)
  const handleDeleteExhibition = async (categoryId: string) => {
    try {
      await deleteExhibitionMutation.mutateAsync(categoryId);
      message.success('전시명 카테고리가 삭제되었습니다.');
    } catch {
      message.error('삭제에 실패했습니다.');
    }
  };

  // 새 문장 추가 모달 열기
  const handleAddSentence = () => {
    setEditingSentence(null);
    form.resetFields();
    setKeywords([]);
    setSentenceText('');
    setSentenceModalVisible(true);
  };

  // 문장 편집 모달 열기
  const handleEditSentence = (category: SentenceCategory) => {
    setEditingSentence(category);
    form.setFieldsValue({
      sentence: category.sentence,
    });
    setKeywords(category.keywords || []);
    setSentenceText(category.sentence);
    setSentenceModalVisible(true);
  };

  // 문장 입력 변경 핸들러
  const handleSentenceChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setSentenceText(newText);
    // 문장이 변경되면 기존 키워드의 위치를 새 문장에서 다시 찾기
    setKeywords((prevKeywords) =>
      prevKeywords
        .map((kw) => {
          // 키워드 이름으로 새 위치 찾기
          const newStartIndex = newText.indexOf(kw.name);
          if (newStartIndex === -1) {
            // 키워드가 새 문장에 없으면 null 반환 (나중에 필터링)
            return null;
          }
          return {
            ...kw,
            startIndex: newStartIndex,
            endIndex: newStartIndex + kw.name.length,
          };
        })
        .filter((kw): kw is KeywordCategory => kw !== null)
    );
  }, []);

  // 텍스트 선택으로 키워드 추가
  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const selectedText = selection.toString().trim();
    if (!selectedText) return;

    // 선택된 텍스트의 위치 찾기
    const startIndex = sentenceText.indexOf(selectedText);
    if (startIndex === -1) return;

    const endIndex = startIndex + selectedText.length;

    // 이미 존재하는 키워드인지 확인 (같은 텍스트 또는 같은 위치)
    const existsByName = keywords.some((kw) => kw.name === selectedText);
    const existsByPosition = keywords.some(
      (kw) => kw.startIndex === startIndex && kw.endIndex === endIndex
    );
    if (existsByName || existsByPosition) {
      void message.warning('이미 추가된 키워드입니다.');
      return;
    }

    // 겹치는 키워드가 있는지 확인
    const overlaps = keywords.some(
      (kw) =>
        (startIndex >= kw.startIndex && startIndex < kw.endIndex) ||
        (endIndex > kw.startIndex && endIndex <= kw.endIndex) ||
        (startIndex <= kw.startIndex && endIndex >= kw.endIndex)
    );
    if (overlaps) {
      void message.warning('다른 키워드와 겹칩니다.');
      return;
    }

    // 키워드 ID를 name 기반으로 생성 (문장 편집 후에도 같은 단어는 같은 ID 유지)
    // 특수문자 제거하고 소문자로 변환하여 일관된 ID 생성
    const normalizedName = selectedText.toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
    const keywordId = `kw-${normalizedName}`;

    const newKeyword: KeywordCategory = {
      id: keywordId,
      name: selectedText,
      startIndex,
      endIndex,
      workOrders: [],
    };

    setKeywords((prev) => [...prev, newKeyword]);
    selection.removeAllRanges();
    void message.success(`"${selectedText}" 키워드가 추가되었습니다.`);
  }, [sentenceText, keywords]);

  // 키워드 삭제
  const handleRemoveKeyword = useCallback((keywordId: string) => {
    setKeywords((prev) => prev.filter((kw) => kw.id !== keywordId));
  }, []);

  // 문장에서 키워드 하이라이트 렌더링
  const renderHighlightedSentence = useCallback(() => {
    if (!sentenceText) return null;

    // 키워드를 startIndex 기준으로 정렬
    const sortedKeywords = [...keywords].sort((a, b) => a.startIndex - b.startIndex);

    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    sortedKeywords.forEach((kw, idx) => {
      // 키워드 이전 텍스트
      if (kw.startIndex > lastIndex) {
        elements.push(
          <span key={`text-${idx}`}>{sentenceText.slice(lastIndex, kw.startIndex)}</span>
        );
      }
      // 키워드 (하이라이트)
      elements.push(
        <Tooltip key={`kw-${kw.id}`} title="클릭하여 삭제">
          <Tag
            color="blue"
            style={{ cursor: 'pointer', margin: '0 2px' }}
            onClick={() => handleRemoveKeyword(kw.id)}
          >
            {kw.name}
          </Tag>
        </Tooltip>
      );
      lastIndex = kw.endIndex;
    });

    // 마지막 키워드 이후 텍스트
    if (lastIndex < sentenceText.length) {
      elements.push(<span key="text-last">{sentenceText.slice(lastIndex)}</span>);
    }

    return elements;
  }, [sentenceText, keywords, handleRemoveKeyword]);

  // 문장 저장 (Firebase)
  const handleSaveSentence = async () => {
    try {
      const values = await form.validateFields();
      if (editingSentence) {
        await updateSentenceMutation.mutateAsync({
          id: editingSentence.id,
          updates: { sentence: values.sentence, keywords },
        });
        message.success('문장이 수정되었습니다.');
      } else {
        await createSentenceMutation.mutateAsync({
          sentence: values.sentence,
          keywords,
          displayOrder: sentenceCategories.length + 1,
          isActive: true,
        });
        message.success('문장이 추가되었습니다.');
      }
      setSentenceModalVisible(false);
      setKeywords([]);
      setSentenceText('');
    } catch {
      message.error('저장에 실패했습니다.');
    }
  };

  // 새 전시명 카테고리 추가
  const handleAddExhibition = () => {
    setEditingExhibition(null);
    exhibitionForm.resetFields();
    setExhibitionModalVisible(true);
  };

  // 전시명 카테고리 편집
  const handleEditExhibition = (category: ExhibitionCategory) => {
    setEditingExhibition(category);
    exhibitionForm.setFieldsValue({
      title: category.title,
      exhibitionType: category.description.exhibitionType,
      venue: category.description.venue,
      year: category.description.year,
    });
    setExhibitionModalVisible(true);
  };

  // 전시명 카테고리 저장 (Firebase)
  const handleSaveExhibition = async () => {
    try {
      const values = await exhibitionForm.validateFields();
      const categoryData = {
        title: values.title,
        description: {
          exhibitionType: values.exhibitionType,
          venue: values.venue,
          year: Number(values.year),
        },
      };

      if (editingExhibition) {
        await updateExhibitionMutation.mutateAsync({
          id: editingExhibition.id,
          updates: categoryData,
        });
        message.success('전시명 카테고리가 수정되었습니다.');
      } else {
        await createExhibitionMutation.mutateAsync({
          ...categoryData,
          displayOrder: exhibitionCategories.length + 1,
          workOrders: [],
          isActive: true,
        });
        message.success('전시명 카테고리가 추가되었습니다.');
      }
      setExhibitionModalVisible(false);
    } catch {
      message.error('저장에 실패했습니다.');
    }
  };

  // 작업 순서 변경 (키워드 또는 전시명 카테고리 내 작업 순서 변경)
  const handleWorkOrderChange = (categoryType: 'sentence' | 'exhibition', categoryId: string) => {
    if (categoryType === 'sentence') {
      // 문장형 카테고리의 키워드 찾기
      const category = sentenceCategories.find((cat) => cat.keywords.some((kw) => kw.id === categoryId));
      const keyword = category?.keywords.find((kw) => kw.id === categoryId);

      if (!keyword || !keyword.workOrders || keyword.workOrders.length === 0) {
        void message.warning('순서를 변경할 작업이 없습니다.');
        return;
      }

      // 작업 순서 변경 모달 표시
      Modal.confirm({
        title: `"${keyword.name}" 작업 순서 변경`,
        content: '작업 순서 변경 기능은 드래그 앤 드롭으로 구현할 예정입니다. 현재는 수동으로 작업 ID와 순서를 지정해야 합니다.',
        okText: '확인',
        cancelText: '취소',
        onOk: () => {
          void message.info('작업 순서 변경 UI는 향후 구현 예정입니다.');
        },
      });
    } else {
      // 전시명 카테고리 찾기
      const category = exhibitionCategories.find((cat) => cat.id === categoryId);

      if (!category || !category.workOrders || category.workOrders.length === 0) {
        void message.warning('순서를 변경할 작업이 없습니다.');
        return;
      }

      // 작업 순서 변경 모달 표시
      Modal.confirm({
        title: `"${category.title}" 작업 순서 변경`,
        content: '작업 순서 변경 기능은 드래그 앤 드롭으로 구현할 예정입니다. 현재는 수동으로 작업 ID와 순서를 지정해야 합니다.',
        okText: '확인',
        cancelText: '취소',
        onOk: () => {
          void message.info('작업 순서 변경 UI는 향후 구현 예정입니다.');
        },
      });
    }
  };

  // 문장형 카테고리 Collapse 아이템 생성 (모바일용)
  const sentenceCollapseItems = sentenceCategories.map((category, index) => {
    return {
      key: category.id,
      label: `"${category.sentence}"`,
      children: (
        <Space direction="vertical" style={{ width: '100%' }}>
          {/* 키워드 목록 */}
          {category.keywords.length > 0 && (
            <div>
              <div style={{ marginBottom: '8px' }}>
                <Typography.Text type="secondary">키워드 ({category.keywords.length}개):</Typography.Text>
              </div>
              <Space wrap>
                {category.keywords.map((keyword) => {
                  const workCount = getWorkCount(keyword.id);
                  return (
                    <Tag key={keyword.id} color="blue">
                      {keyword.name} ({workCount}개)
                    </Tag>
                  );
                })}
              </Space>
            </div>
          )}
          {category.keywords.length === 0 && (
            <Typography.Text type="secondary">등록된 키워드가 없습니다.</Typography.Text>
          )}

          {/* 액션 버튼 */}
          <Divider style={{ margin: '12px 0' }} />
          <Button
            block
            icon={<EditOutlined />}
            onClick={() => handleEditSentence(category)}
          >
            편집
          </Button>
          <Popconfirm
            title="정말 삭제하시겠습니까?"
            onConfirm={() => void handleDeleteSentence(category.id)}
            okText="삭제"
            cancelText="취소"
            okButtonProps={{ danger: true }}
          >
            <Button block danger icon={<DeleteOutlined />}>
              삭제
            </Button>
          </Popconfirm>
        </Space>
      ),
      extra: (
        <Space>
          <Button
            size="small"
            icon={<ArrowUpOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              void handleMoveSentence(index, 'up');
            }}
            disabled={index === 0}
          />
          <Button
            size="small"
            icon={<ArrowDownOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              void handleMoveSentence(index, 'down');
            }}
            disabled={index === sentenceCategories.length - 1}
          />
        </Space>
      ),
    };
  });

  // 전시명 카테고리 Collapse 아이템 생성 (모바일용)
  const exhibitionCollapseItems = exhibitionCategories.map((category, index) => {
    const workCount = getExhibitionCategoryWorkCount(category.id);
    return {
      key: category.id,
      label: (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{category.title}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
            {category.description.exhibitionType}, {category.description.venue}, {category.description.year}
          </Typography.Text>
        </Space>
      ),
      children: (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Tag color="blue">작업 {workCount}개</Tag>
          <Button
            block
            icon={<DragOutlined />}
            onClick={() => handleWorkOrderChange('exhibition', category.id)}
          >
            작업 순서 변경
          </Button>
          <Button
            block
            icon={<EditOutlined />}
            onClick={() => handleEditExhibition(category)}
          >
            편집
          </Button>
          <Popconfirm
            title="정말 삭제하시겠습니까?"
            onConfirm={() => void handleDeleteExhibition(category.id)}
            okText="삭제"
            cancelText="취소"
            okButtonProps={{ danger: true }}
          >
            <Button block danger icon={<DeleteOutlined />}>
              삭제
            </Button>
          </Popconfirm>
        </Space>
      ),
      extra: (
        <Space>
          <Button
            size="small"
            icon={<ArrowUpOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              void handleMoveExhibition(index, 'up');
            }}
            disabled={index === 0}
          />
          <Button
            size="small"
            icon={<ArrowDownOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              void handleMoveExhibition(index, 'down');
            }}
            disabled={index === exhibitionCategories.length - 1}
          />
        </Space>
      ),
    };
  });

  // 로딩 상태
  if (isSentenceLoading || isExhibitionLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Spin size="large" tip="카테고리를 불러오는 중..." />
      </div>
    );
  }

  return (
    <div className="categories">
      <Title level={2}><FolderOutlined /> 카테고리 관리</Title>

      {/* 데스크탑: Card 형식, 모바일: Collapse 형식 */}
      {/* 문장형 카테고리 섹션 - 데스크탑 */}
      {!isMobile && (
        <Card
          title={<><FileTextOutlined /> 문장형 카테고리</>}
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddSentence}>
              새 문장 추가
            </Button>
          }
          style={{ marginBottom: '24px' }}
        >
        {sentenceCategories.map((category, index) => (
          <Card
            key={category.id}
            style={{ marginBottom: '16px' }}
            actions={[
              <Button
                key="up"
                icon={<ArrowUpOutlined />}
                onClick={() => void handleMoveSentence(index, 'up')}
                disabled={index === 0}
              >
                위로
              </Button>,
              <Button
                key="down"
                icon={<ArrowDownOutlined />}
                onClick={() => void handleMoveSentence(index, 'down')}
                disabled={index === sentenceCategories.length - 1}
              >
                아래
              </Button>,
              <Popconfirm
                key="delete"
                title="정말 삭제하시겠습니까?"
                onConfirm={() => void handleDeleteSentence(category.id)}
                okText="삭제"
                cancelText="취소"
                okButtonProps={{ danger: true }}
              >
                <Button danger icon={<DeleteOutlined />}>
                  삭제
                </Button>
              </Popconfirm>,
              <Button key="edit" icon={<EditOutlined />} onClick={() => handleEditSentence(category)}>
                편집
              </Button>,
            ]}
          >
            <div style={{ marginBottom: '16px' }}>
              <Typography.Text strong style={{ fontSize: '16px' }}>
                "{category.sentence}"
              </Typography.Text>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <Typography.Text type="secondary">키워드 (카테고리):</Typography.Text>
            </div>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              {category.keywords.map((keyword) => {
                const workCount = getWorkCount(keyword.id);
                return (
                  <div
                    key={keyword.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px',
                      background: '#fafafa',
                      borderRadius: '4px',
                    }}
                  >
                    <span>
                      • {keyword.name} ({keyword.startIndex}-{keyword.endIndex}) - 작업 {workCount}개
                    </span>
                    <Button
                      size="small"
                      icon={<DragOutlined />}
                      onClick={() => handleWorkOrderChange('sentence', keyword.id)}
                    >
                      순서 변경
                    </Button>
                  </div>
                );
              })}
            </Space>
          </Card>
        ))}
        </Card>
      )}

      {/* 전시명 카테고리 섹션 - 데스크탑 */}
      {!isMobile && (
        <Card
          title={<><FolderOutlined /> 전시명 카테고리</>}
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddExhibition}>
              새 전시 추가
            </Button>
          }
        >
        {exhibitionCategories.map((category, index) => {
          const workCount = getExhibitionCategoryWorkCount(category.id);
          return (
            <Card
              key={category.id}
              style={{ marginBottom: '16px' }}
              actions={[
                <Button
                  key="up"
                  icon={<ArrowUpOutlined />}
                  onClick={() => void handleMoveExhibition(index, 'up')}
                  disabled={index === 0}
                >
                  위로
                </Button>,
                <Button
                  key="down"
                  icon={<ArrowDownOutlined />}
                  onClick={() => void handleMoveExhibition(index, 'down')}
                  disabled={index === exhibitionCategories.length - 1}
                >
                  아래
                </Button>,
                <Popconfirm
                  key="delete"
                  title="정말 삭제하시겠습니까?"
                  onConfirm={() => void handleDeleteExhibition(category.id)}
                  okText="삭제"
                  cancelText="취소"
                  okButtonProps={{ danger: true }}
                >
                  <Button danger icon={<DeleteOutlined />}>
                    삭제
                  </Button>
                </Popconfirm>,
                <Button key="edit" icon={<EditOutlined />} onClick={() => handleEditExhibition(category)}>
                  편집
                </Button>,
              ]}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DragOutlined style={{ fontSize: '20px', color: '#8c8c8c' }} />
                <div>
                  <Typography.Text strong style={{ fontSize: '16px' }}>
                    {category.title}
                  </Typography.Text>
                  <Typography.Text type="secondary" style={{ marginLeft: '8px' }}>
                    | {category.description.exhibitionType}, {category.description.venue}, {category.description.year}
                  </Typography.Text>
                </div>
                <Tag color="blue">작업 {workCount}개</Tag>
              </div>
            </Card>
          );
        })}
      </Card>
      )}

      {/* 모바일 - Collapse 형식 */}
      {isMobile && (
        <>
          <Card
            title={<><FileTextOutlined /> 문장형 카테고리</>}
            extra={
              <Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleAddSentence}>
                추가
              </Button>
            }
            style={{ marginBottom: '16px' }}
          >
            <Collapse items={sentenceCollapseItems} />
          </Card>

          <Card
            title={<><FolderOutlined /> 전시명 카테고리</>}
            extra={
              <Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleAddExhibition}>
                추가
              </Button>
            }
          >
            <Collapse items={exhibitionCollapseItems} />
          </Card>
        </>
      )}

      {/* 문장형 카테고리 추가/편집 모달 */}
      <Modal
        title={editingSentence ? '문장 편집' : '새 문장 추가'}
        open={sentenceModalVisible}
        onOk={handleSaveSentence}
        onCancel={() => {
          setSentenceModalVisible(false);
          setKeywords([]);
          setSentenceText('');
        }}
        okText="저장"
        cancelText="취소"
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="sentence"
            label="문장"
            rules={[{ required: true, message: '문장을 입력해주세요.' }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="예: 물은 아름다운 불과 같다"
              onChange={handleSentenceChange}
            />
          </Form.Item>

          {/* 키워드 선택 영역 */}
          {sentenceText && (
            <>
              <Divider style={{ margin: '16px 0' }} />
              <div style={{ marginBottom: '16px' }}>
                <Typography.Text strong>
                  <HighlightOutlined /> 키워드 선택
                </Typography.Text>
                <Typography.Text type="secondary" style={{ display: 'block', fontSize: '12px', marginTop: '4px' }}>
                  아래 문장에서 텍스트를 드래그하여 선택한 후 "키워드 추가" 버튼을 클릭하세요.
                </Typography.Text>
              </div>

              {/* 선택 가능한 문장 영역 */}
              <div
                style={{
                  padding: '16px',
                  background: '#fafafa',
                  borderRadius: '8px',
                  border: '1px solid #d9d9d9',
                  marginBottom: '12px',
                  fontSize: '16px',
                  lineHeight: '1.8',
                  userSelect: 'text',
                }}
              >
                {sentenceText}
              </div>

              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleTextSelection}
                style={{ marginBottom: '16px' }}
              >
                선택한 텍스트를 키워드로 추가
              </Button>

              {/* 등록된 키워드 미리보기 */}
              {keywords.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <Typography.Text strong style={{ display: 'block', marginBottom: '8px' }}>
                    등록된 키워드 ({keywords.length}개)
                  </Typography.Text>
                  <div
                    style={{
                      padding: '12px',
                      background: '#f5f5f5',
                      borderRadius: '8px',
                      lineHeight: '2',
                    }}
                  >
                    {renderHighlightedSentence()}
                  </div>
                  <div style={{ marginTop: '12px' }}>
                    <Space wrap>
                      {keywords.map((kw) => (
                        <Tag
                          key={kw.id}
                          color="blue"
                          closable
                          onClose={() => handleRemoveKeyword(kw.id)}
                          style={{ marginBottom: '4px' }}
                        >
                          {kw.name}
                          <Typography.Text type="secondary" style={{ fontSize: '10px', marginLeft: '4px' }}>
                            ({kw.startIndex}-{kw.endIndex})
                          </Typography.Text>
                        </Tag>
                      ))}
                    </Space>
                  </div>
                </div>
              )}
            </>
          )}
        </Form>
      </Modal>

      {/* 전시명 카테고리 추가/편집 모달 */}
      <Modal
        title={editingExhibition ? '전시명 카테고리 편집' : '새 전시명 카테고리 추가'}
        open={exhibitionModalVisible}
        onOk={handleSaveExhibition}
        onCancel={() => setExhibitionModalVisible(false)}
        okText={editingExhibition ? '저장' : '추가'}
        cancelText="취소"
      >
        <Form form={exhibitionForm} layout="vertical">
          <Form.Item
            name="title"
            label="작업명"
            rules={[{ required: true, message: '작업명을 입력해주세요.' }]}
          >
            <Input placeholder="예: Cushioning Attack" />
          </Form.Item>
          <Form.Item
            name="exhibitionType"
            label="전시 유형"
            rules={[{ required: true, message: '전시 유형을 선택해주세요.' }]}
          >
            <Input placeholder="예: 개인전, 2인전, 그룹전, 기타" />
          </Form.Item>
          <Form.Item
            name="venue"
            label="공간"
            rules={[{ required: true, message: '공간을 입력해주세요.' }]}
          >
            <Input placeholder="예: YPCSpace" />
          </Form.Item>
          <Form.Item
            name="year"
            label="년도"
            rules={[{ required: true, message: '년도를 입력해주세요.' }]}
          >
            <Input type="number" placeholder="예: 2024" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Categories;
