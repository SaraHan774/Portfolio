// 카테고리 관리 페이지 컴포넌트
import { useState, useEffect } from 'react';
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
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  DragOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import {
  mockSentenceCategories,
  mockTextCategories,
  mockWorks,
} from '../services/mockData';
import type { SentenceCategory, TextCategory } from '../types';
import './Categories.css';

const { Title } = Typography;

const Categories = () => {
  const [sentenceModalVisible, setSentenceModalVisible] = useState(false);
  const [textModalVisible, setTextModalVisible] = useState(false);
  const [editingSentence, setEditingSentence] = useState<SentenceCategory | null>(null);
  const [editingText, setEditingText] = useState<TextCategory | null>(null);
  const [form] = Form.useForm();
  const [textForm] = Form.useForm();
  const [isMobile, setIsMobile] = useState(false);

  // 모바일 여부 확인
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 문장형 카테고리 조회
  const { data: sentenceCategories = [], refetch: refetchSentences } = useQuery({
    queryKey: ['sentenceCategories'],
    queryFn: async () => mockSentenceCategories,
  });

  // 텍스트형 카테고리 조회
  const { data: textCategories = [], refetch: refetchTexts } = useQuery({
    queryKey: ['textCategories'],
    queryFn: async () => mockTextCategories,
  });

  // 작업 개수 계산 (키워드별)
  const getWorkCount = (keywordId: string) => {
    return mockWorks.filter((work) => work.sentenceCategoryIds.includes(keywordId)).length;
  };

  // 텍스트 카테고리 작업 개수 계산
  const getTextCategoryWorkCount = (categoryId: string) => {
    return mockWorks.filter((work) => work.textCategoryIds.includes(categoryId)).length;
  };

  // 문장형 카테고리 순서 변경
  const handleMoveSentence = (_index: number, _direction: 'up' | 'down') => {
    message.success('순서가 변경되었습니다. (실제 구현 시 서버에 저장)');
    refetchSentences();
  };

  // 텍스트형 카테고리 순서 변경
  const handleMoveText = (_index: number, _direction: 'up' | 'down') => {
    message.success('순서가 변경되었습니다. (실제 구현 시 서버에 저장)');
    refetchTexts();
  };

  // 문장형 카테고리 삭제
  const handleDeleteSentence = (_categoryId: string) => {
    message.success('문장이 삭제되었습니다.');
    refetchSentences();
  };

  // 텍스트형 카테고리 삭제
  const handleDeleteText = (_categoryId: string) => {
    message.success('카테고리가 삭제되었습니다.');
    refetchTexts();
  };

  // 새 문장 추가 모달 열기
  const handleAddSentence = () => {
    setEditingSentence(null);
    form.resetFields();
    setSentenceModalVisible(true);
  };

  // 문장 편집 모달 열기
  const handleEditSentence = (category: SentenceCategory) => {
    setEditingSentence(category);
    form.setFieldsValue({
      sentence: category.sentence,
    });
    setSentenceModalVisible(true);
  };

  // 문장 저장
  const handleSaveSentence = async () => {
    try {
      await form.validateFields();
      if (editingSentence) {
        message.success('문장이 수정되었습니다.');
      } else {
        message.success('문장이 추가되었습니다.');
      }
      setSentenceModalVisible(false);
      refetchSentences();
    } catch (error) {
      console.error('저장 실패:', error);
    }
  };

  // 새 텍스트 카테고리 추가
  const handleAddText = () => {
    setEditingText(null);
    textForm.resetFields();
    setTextModalVisible(true);
  };

  // 텍스트 카테고리 편집
  const handleEditText = (category: TextCategory) => {
    setEditingText(category);
    textForm.setFieldsValue({
      name: category.name,
    });
    setTextModalVisible(true);
  };

  // 텍스트 카테고리 저장
  const handleSaveText = async () => {
    try {
      await textForm.validateFields();
      if (editingText) {
        message.success('카테고리가 수정되었습니다.');
      } else {
        message.success('카테고리가 추가되었습니다.');
      }
      setTextModalVisible(false);
      refetchTexts();
    } catch (error) {
      console.error('저장 실패:', error);
    }
  };

  // 작업 순서 변경 모달 (간단 구현)
  const handleWorkOrderChange = (_categoryType: 'sentence' | 'text', _categoryId: string) => {
    message.info('작업 순서 변경 기능은 향후 구현 예정입니다.');
  };

  // 문장형 카테고리 Collapse 아이템 생성 (모바일용)
  const sentenceCollapseItems = sentenceCategories.map((category, index) => {
    return {
      key: category.id,
      label: `"${category.sentence}"`,
      children: (
        <div>
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
                    padding: '12px',
                    background: '#fafafa',
                    borderRadius: '4px',
                    marginBottom: '8px',
                  }}
                >
                  <div style={{ marginBottom: '8px' }}>
                    <Typography.Text strong>
                      • {keyword.name}
                    </Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>
                      ({keyword.startIndex}-{keyword.endIndex}) - 작업 {workCount}개
                    </Typography.Text>
                  </div>
                  <Space wrap style={{ width: '100%' }}>
                    <Button
                      size="small"
                      icon={<DragOutlined />}
                      onClick={() => handleWorkOrderChange('sentence', keyword.id)}
                    >
                      순서 변경
                    </Button>
                  </Space>
                </div>
              );
            })}
          </Space>
        </div>
      ),
      extra: (
        <Space>
          <Button
            size="small"
            icon={<ArrowUpOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleMoveSentence(index, 'up');
            }}
            disabled={index === 0}
          />
          <Button
            size="small"
            icon={<ArrowDownOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleMoveSentence(index, 'down');
            }}
            disabled={index === sentenceCategories.length - 1}
          />
        </Space>
      ),
    };
  });

  // 텍스트형 카테고리 Collapse 아이템 생성 (모바일용)
  const textCollapseItems = textCategories.map((category, index) => {
    const workCount = getTextCategoryWorkCount(category.id);
    return {
      key: category.id,
      label: (
        <Space>
          <Typography.Text strong>{category.name}</Typography.Text>
          <Tag color="blue">작업 {workCount}개</Tag>
        </Space>
      ),
      children: (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button
            block
            icon={<DragOutlined />}
            onClick={() => handleWorkOrderChange('text', category.id)}
          >
            작업 순서 변경
          </Button>
          <Button
            block
            icon={<EditOutlined />}
            onClick={() => handleEditText(category)}
          >
            편집
          </Button>
          <Popconfirm
            title="정말 삭제하시겠습니까?"
            onConfirm={() => handleDeleteText(category.id)}
            okText="삭제"
            cancelText="취소"
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
              handleMoveText(index, 'up');
            }}
            disabled={index === 0}
          />
          <Button
            size="small"
            icon={<ArrowDownOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleMoveText(index, 'down');
            }}
            disabled={index === textCategories.length - 1}
          />
        </Space>
      ),
    };
  });

  return (
    <div className="categories">
      <Title level={2}>📁 카테고리 관리</Title>

      {/* 데스크탑: Card 형식, 모바일: Collapse 형식 */}
      {/* 문장형 카테고리 섹션 - 데스크탑 */}
      {!isMobile && (
        <Card
          title="📝 문장형 카테고리"
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
                onClick={() => handleMoveSentence(index, 'up')}
                disabled={index === 0}
              >
                위로
              </Button>,
              <Button
                key="down"
                icon={<ArrowDownOutlined />}
                onClick={() => handleMoveSentence(index, 'down')}
                disabled={index === sentenceCategories.length - 1}
              >
                아래
              </Button>,
              <Popconfirm
                key="delete"
                title="정말 삭제하시겠습니까?"
                onConfirm={() => handleDeleteSentence(category.id)}
                okText="삭제"
                cancelText="취소"
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

      {/* 텍스트형 카테고리 섹션 - 데스크탑 */}
      {!isMobile && (
        <Card
          title="📁 텍스트형 카테고리"
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddText}>
              새 카테고리 추가
            </Button>
          }
        >
        {textCategories.map((category, index) => {
          const workCount = getTextCategoryWorkCount(category.id);
          return (
            <Card
              key={category.id}
              style={{ marginBottom: '16px' }}
              actions={[
                <Button
                  key="up"
                  icon={<ArrowUpOutlined />}
                  onClick={() => handleMoveText(index, 'up')}
                  disabled={index === 0}
                >
                  위로
                </Button>,
                <Button
                  key="down"
                  icon={<ArrowDownOutlined />}
                  onClick={() => handleMoveText(index, 'down')}
                  disabled={index === textCategories.length - 1}
                >
                  아래
                </Button>,
                <Button
                  key="order"
                  icon={<DragOutlined />}
                  onClick={() => handleWorkOrderChange('text', category.id)}
                >
                  순서
                </Button>,
                <Button key="edit" icon={<EditOutlined />} onClick={() => handleEditText(category)}>
                  편집
                </Button>,
              ]}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DragOutlined style={{ fontSize: '20px', color: '#8c8c8c' }} />
                <Typography.Text strong style={{ fontSize: '16px' }}>
                  {category.name}
                </Typography.Text>
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
            title="📝 문장형 카테고리"
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
            title="📁 텍스트형 카테고리"
            extra={
              <Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleAddText}>
                추가
              </Button>
            }
          >
            <Collapse items={textCollapseItems} />
          </Card>
        </>
      )}

      {/* 문장형 카테고리 추가/편집 모달 */}
      <Modal
        title={editingSentence ? '문장 편집' : '새 문장 추가'}
        open={sentenceModalVisible}
        onOk={handleSaveSentence}
        onCancel={() => setSentenceModalVisible(false)}
        okText="저장"
        cancelText="취소"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="sentence"
            label="문장"
            rules={[{ required: true, message: '문장을 입력해주세요.' }]}
          >
            <Input.TextArea rows={3} placeholder="예: 물은 아름다운 불과 같다" />
          </Form.Item>
          <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
            ※ 키워드 선택 기능은 향후 구현 예정입니다.
          </Typography.Text>
        </Form>
      </Modal>

      {/* 텍스트형 카테고리 추가/편집 모달 */}
      <Modal
        title={editingText ? '카테고리 편집' : '새 카테고리 추가'}
        open={textModalVisible}
        onOk={handleSaveText}
        onCancel={() => setTextModalVisible(false)}
        okText="저장"
        cancelText="취소"
      >
        <Form form={textForm} layout="vertical">
          <Form.Item
            name="name"
            label="카테고리명"
            rules={[{ required: true, message: '카테고리명을 입력해주세요.' }]}
          >
            <Input placeholder="예: 디자인" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Categories;
